"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Trash2, Edit2, ArrowUp, ArrowDown, ImageIcon,
  ExternalLink, CheckCircle2, Upload,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface WebsiteBanner {
  id: string;
  title: string;
  subtitle?: string;
  imageUrl?: string;
  linkUrl?: string;
  isActive: boolean;
  position: number;
  startDate?: string;
  endDate?: string;
  branchId: string;
}

const BLANK = {
  title: "", subtitle: "", imageUrl: "", linkUrl: "", isActive: true, startDate: "", endDate: "",
};

// Compress image to JPEG base64 (max 1200px wide for banners)
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 1200;
      let { width, height } = img;
      if (width > MAX) { height = Math.round(height * MAX / width); width = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.8));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export default function BannerImagesPage() {
  const { currentBranch } = useBranch();

  const { data: banners, loading } = useFirestoreCollection<WebsiteBanner>("websiteBanners", currentBranch);

  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<WebsiteBanner | null>(null);
  const [form,         setForm]         = useState({ ...BLANK });
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteBanner | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sorted = useMemo(() =>
    [...banners].sort((a, b) => a.position - b.position),
    [banners],
  );

  const activeCount = sorted.filter(b => b.isActive).length;
  const firstActive = sorted.find(b => b.isActive);

  const toggleActive = async (b: WebsiteBanner) => {
    try {
      await updateDocument("websiteBanners", b.id, { isActive: !b.isActive });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const moveUp = async (b: WebsiteBanner, idx: number) => {
    if (idx === 0) return;
    const above = sorted[idx - 1];
    try {
      await Promise.all([
        updateDocument("websiteBanners", b.id,     { position: above.position }),
        updateDocument("websiteBanners", above.id, { position: b.position }),
      ]);
    } catch {
      toast({ title: "Error", description: "Failed to reorder.", variant: "destructive" });
    }
  };

  const moveDown = async (b: WebsiteBanner, idx: number) => {
    if (idx === sorted.length - 1) return;
    const below = sorted[idx + 1];
    try {
      await Promise.all([
        updateDocument("websiteBanners", b.id,     { position: below.position }),
        updateDocument("websiteBanners", below.id, { position: b.position }),
      ]);
    } catch {
      toast({ title: "Error", description: "Failed to reorder.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("websiteBanners", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.title}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK });
    setSelectedFile(null);
    setPreviewUrl("");
    setShowForm(true);
  };

  const openEdit = (b: WebsiteBanner) => {
    setEditing(b);
    setForm({
      title:     b.title,
      subtitle:  b.subtitle  ?? "",
      imageUrl:  b.imageUrl  ?? "",
      linkUrl:   b.linkUrl   ?? "",
      isActive:  b.isActive,
      startDate: b.startDate ?? "",
      endDate:   b.endDate   ?? "",
    });
    setSelectedFile(null);
    setPreviewUrl(b.imageUrl ?? "");
    setShowForm(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      setPreviewUrl(URL.createObjectURL(file));
      if (!form.title) setForm(p => ({ ...p, title: file.name.replace(/\.[^.]+$/, "") }));
    }
  };

  const resetDialog = () => {
    setForm({ ...BLANK });
    setSelectedFile(null);
    setPreviewUrl("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Headline required", variant: "destructive" });
      return;
    }
    // need image for new banners; for edit allow keeping existing
    if (!editing && !selectedFile) {
      toast({ title: "Please select a banner image", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      let imageUrl = form.imageUrl; // keep existing when editing
      if (selectedFile) {
        imageUrl = await compressImage(selectedFile);
      }

      const payload = {
        title:     form.title.trim(),
        subtitle:  form.subtitle.trim()  || null,
        imageUrl:  imageUrl              || null,
        linkUrl:   form.linkUrl.trim()   || null,
        isActive:  form.isActive,
        startDate: form.startDate        || null,
        endDate:   form.endDate          || null,
      };

      if (editing) {
        await updateDocument("websiteBanners", editing.id, payload);
        toast({ title: "Banner Updated", description: form.title.trim() });
      } else {
        const maxPos = sorted.length > 0 ? Math.max(...sorted.map(b => b.position)) : 0;
        await addDocument("websiteBanners", { ...payload, position: maxPos + 1, branchId: currentBranch });
        toast({ title: "Banner Added", description: form.title.trim() });
      }
      setShowForm(false);
      resetDialog();
    } catch {
      toast({ title: "Error", description: "Failed to save banner.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Banner Images" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Banner Images</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Website Banners</h2>
            {loading
              ? <Skeleton className="h-4 w-48 mt-1" />
              : <p className="text-sm text-muted-foreground">{activeCount} active · {sorted.length} total</p>
            }
          </div>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Banner
          </Button>
        </div>

        {/* Preview of first active banner */}
        {!loading && firstActive?.imageUrl && (
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-slate-50 border-b py-3 px-6">
              <CardTitle className="text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" /> Website Preview — Active Banner #1
              </CardTitle>
            </CardHeader>
            <div className="relative h-48 bg-slate-200">
              <img src={firstActive.imageUrl} alt="banner preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-transparent flex flex-col justify-center pl-8">
                <p className="text-white text-xl font-bold">{firstActive.title}</p>
                {firstActive.subtitle && (
                  <p className="text-white/80 text-sm mt-1 max-w-sm">{firstActive.subtitle}</p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Banner list */}
        <div className="space-y-3">
          {loading ? (
            [...Array(3)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm overflow-hidden">
                <CardContent className="p-0">
                  <div className="flex items-stretch">
                    <div className="w-1 bg-slate-200 flex-shrink-0" />
                    <Skeleton className="w-32 h-20 flex-shrink-0 rounded-none" />
                    <div className="flex-1 p-4 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : sorted.length === 0 ? (
            <Card className="border-none shadow-sm">
              <CardContent className="h-40 flex items-center justify-center">
                <div className="text-center text-muted-foreground space-y-2">
                  <ImageIcon className="h-10 w-10 mx-auto opacity-20" />
                  <p>No banners yet. Click &quot;Add Banner&quot; to create one.</p>
                </div>
              </CardContent>
            </Card>
          ) : sorted.map((b, idx) => (
            <Card key={b.id} className={`border-none shadow-sm overflow-hidden ${!b.isActive ? "opacity-60" : ""}`}>
              <CardContent className="p-0">
                <div className="flex items-stretch">
                  <div className={`w-1 flex-shrink-0 ${b.isActive ? "bg-[#0D7C8F]" : "bg-slate-200"}`} />
                  <div className="w-32 h-20 flex-shrink-0 bg-slate-100 overflow-hidden">
                    {b.imageUrl
                      ? <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><ImageIcon className="h-6 w-6 text-slate-300" /></div>
                    }
                  </div>
                  <div className="flex-1 p-4 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <Badge variant="outline" className="text-xs px-1.5">#{b.position}</Badge>
                          {b.isActive
                            ? <Badge className="text-xs bg-green-100 text-green-700">Active</Badge>
                            : <Badge variant="outline" className="text-xs text-slate-400">Inactive</Badge>
                          }
                        </div>
                        <p className="font-bold text-sm text-[#1E2A4A] truncate">{b.title}</p>
                        {b.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{b.subtitle}</p>}
                        {(b.startDate || b.endDate) && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {b.startDate && `From ${b.startDate}`}{b.endDate && ` → ${b.endDate}`}
                          </p>
                        )}
                        {b.linkUrl && (
                          <div className="flex items-center gap-1 text-xs text-[#0D7C8F] mt-0.5">
                            <ExternalLink className="h-3 w-3" /> {b.linkUrl}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <div className="flex flex-col gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === 0} onClick={() => moveUp(b, idx)}>
                            <ArrowUp className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" disabled={idx === sorted.length - 1} onClick={() => moveDown(b, idx)}>
                            <ArrowDown className="h-3 w-3" />
                          </Button>
                        </div>
                        <Switch checked={b.isActive} onCheckedChange={() => toggleActive(b)} className="scale-75" />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                          onClick={() => setDeleteTarget(b)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Add / Edit Dialog */}
        <Dialog open={showForm} onOpenChange={v => { setShowForm(v); if (!v) resetDialog(); }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit Banner" : "Add New Banner"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* Image upload */}
              <div className="space-y-1.5">
                <Label>Banner Image {!editing && "*"}</Label>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-[#0D7C8F] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="relative h-28">
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6 opacity-40" />
                      <p className="text-xs">Click to select an image</p>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label>Headline *</Label>
                <Input placeholder="e.g. NEET 2026 — Enrol Now" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Subtitle</Label>
                <Input placeholder="Short description shown on banner..." value={form.subtitle}
                  onChange={e => setForm(p => ({ ...p, subtitle: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Link URL (optional)</Label>
                <Input placeholder="/admissions" value={form.linkUrl}
                  onChange={e => setForm(p => ({ ...p, linkUrl: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Start Date</Label>
                  <Input type="date" value={form.startDate}
                    onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>End Date</Label>
                  <Input type="date" value={form.endDate}
                    onChange={e => setForm(p => ({ ...p, endDate: e.target.value }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(p => ({ ...p, isActive: v }))} />
                <Label>Active (show on website)</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSave} disabled={saving}>
                <Upload className="h-4 w-4" /> {saving ? "Saving…" : editing ? "Save Changes" : "Add Banner"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Banner</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>?
            This cannot be undone.
          </p>
          <DialogFooter className="gap-2 mt-2">
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
