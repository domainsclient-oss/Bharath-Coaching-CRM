"use client";

import { useState, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Trash2, Eye, EyeOff, ImageIcon, Upload,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { GalleryCategory } from "@/data/websiteData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface GalleryItem {
  id: string;
  title: string;
  caption?: string;
  imageUrl?: string;
  category: GalleryCategory;
  uploadedAt: string;
  isPublished: boolean;
  branchId: string;
}

const CATEGORIES: GalleryCategory[] = ["Events", "Campus", "Students", "Achievements", "Facilities", "Celebration"];

const CAT_COLORS: Record<GalleryCategory, string> = {
  Events:       "bg-blue-100 text-blue-700",
  Campus:       "bg-teal-100 text-teal-700",
  Students:     "bg-purple-100 text-purple-700",
  Achievements: "bg-amber-100 text-amber-700",
  Facilities:   "bg-green-100 text-green-700",
  Celebration:  "bg-pink-100 text-pink-700",
};

const BLANK = { title: "", caption: "", category: "Events" as GalleryCategory, isPublished: true };

// Resize & compress image to JPEG base64 (max 900px, quality 0.75) — stays within Firestore 1MB limit
function compressImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const MAX = 900;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

export default function GalleryPage() {
  const { currentBranch } = useBranch();

  const { data: gallery, loading } = useFirestoreCollection<GalleryItem>("galleryItems", currentBranch);

  const [catFilter,    setCatFilter]    = useState("All");
  const [showAdd,      setShowAdd]      = useState(false);
  const [form,         setForm]         = useState({ ...BLANK });
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<GalleryItem | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl,   setPreviewUrl]   = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() =>
    gallery.filter(g => catFilter === "All" || g.category === catFilter),
    [gallery, catFilter],
  );

  const publishedCount = filtered.filter(g => g.isPublished).length;

  const togglePublish = async (item: GalleryItem) => {
    try {
      await updateDocument("galleryItems", item.id, { isPublished: !item.isPublished });
    } catch {
      toast({ title: "Error", description: "Failed to update visibility.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("galleryItems", deleteTarget.id);
      toast({ title: "Removed", description: `"${deleteTarget.title}" deleted.` });
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
      setPreviewUrl(URL.createObjectURL(file));
      if (!form.title) setForm(p => ({ ...p, title: file.name.replace(/\.[^.]+$/, "") }));
    } else {
      setPreviewUrl("");
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
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (!selectedFile) {
      toast({ title: "Please select an image", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const imageUrl = await compressImage(selectedFile);
      await addDocument("galleryItems", {
        title:       form.title.trim(),
        caption:     form.caption.trim() || null,
        imageUrl,
        category:    form.category,
        uploadedAt:  new Date().toISOString().slice(0, 10),
        isPublished: form.isPublished,
        branchId:    currentBranch,
      });
      resetDialog();
      setShowAdd(false);
      toast({ title: "Photo Added", description: form.title.trim() });
    } catch {
      toast({ title: "Error", description: "Failed to add photo.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Gallery" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Gallery</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">Gallery</h2>
            {loading
              ? <Skeleton className="h-4 w-36 mt-1" />
              : <p className="text-sm text-muted-foreground">{publishedCount} of {filtered.length} published on website</p>
            }
          </div>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4" /> Add Photo
          </Button>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2">
          {["All", ...CATEGORIES].map(c => (
            <button
              key={c}
              onClick={() => setCatFilter(c)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                catFilter === c
                  ? "bg-[#1E2A4A] text-white border-[#1E2A4A]"
                  : "bg-white text-muted-foreground border-slate-200 hover:border-slate-400"
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardFooter className="p-3 flex flex-col items-start gap-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-40 flex items-center justify-center">
              <div className="text-center text-muted-foreground space-y-2">
                <ImageIcon className="h-10 w-10 mx-auto opacity-20" />
                <p>No gallery items found. Click &quot;Add Photo&quot; to get started.</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filtered.map(g => (
              <Card key={g.id} className="border-none shadow-sm overflow-hidden group">
                <div className="relative h-48 bg-slate-100">
                  {g.imageUrl ? (
                    <img
                      src={g.imageUrl}
                      alt={g.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-300">
                      <ImageIcon className="h-10 w-10" />
                      <p className="text-xs text-slate-400">No image</p>
                    </div>
                  )}
                  {!g.isPublished && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Badge className="bg-black/60 text-white text-xs">Draft</Badge>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <Badge className={`text-xs ${CAT_COLORS[g.category]}`}>{g.category}</Badge>
                  </div>
                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                    <button
                      onClick={() => togglePublish(g)}
                      className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
                      title={g.isPublished ? "Unpublish" : "Publish"}
                    >
                      {g.isPublished ? <EyeOff className="h-4 w-4 text-amber-600" /> : <Eye className="h-4 w-4 text-green-600" />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(g)}
                      className="h-8 w-8 rounded-full bg-white/80 flex items-center justify-center hover:bg-white"
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                </div>
                <CardFooter className="p-3 flex flex-col items-start gap-0.5">
                  <p className="font-medium text-sm text-[#1E2A4A] leading-tight">{g.title}</p>
                  {g.caption && <p className="text-xs text-muted-foreground line-clamp-1">{g.caption}</p>}
                  <div className="flex items-center justify-between w-full mt-1">
                    <p className="text-xs text-muted-foreground">{g.uploadedAt}</p>
                    <div className="flex items-center gap-1">
                      <Switch
                        checked={g.isPublished}
                        onCheckedChange={() => togglePublish(g)}
                        className="scale-75"
                      />
                      <span className="text-xs text-muted-foreground">{g.isPublished ? "Live" : "Draft"}</span>
                    </div>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={showAdd} onOpenChange={v => { setShowAdd(v); if (!v) resetDialog(); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>Add Gallery Photo</DialogTitle></DialogHeader>
            <div className="space-y-4 py-2">
              {/* Image upload */}
              <div className="space-y-1.5">
                <Label>Image * (JPG, PNG, WEBP)</Label>
                <div
                  className="border-2 border-dashed border-slate-200 rounded-lg overflow-hidden cursor-pointer hover:border-[#0D7C8F] transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {previewUrl ? (
                    <div className="relative h-40">
                      <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <p className="text-white text-xs font-medium">Click to change</p>
                      </div>
                    </div>
                  ) : (
                    <div className="h-32 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                      <Upload className="h-6 w-6 opacity-40" />
                      <p className="text-xs">Click to select an image</p>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
                {selectedFile && (
                  <p className="text-xs text-muted-foreground">{selectedFile.name} · {(selectedFile.size / 1024).toFixed(0)} KB</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label>Title *</Label>
                <Input placeholder="e.g. Annual Day 2026" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Caption</Label>
                <Input placeholder="Short description..." value={form.caption} onChange={e => setForm(p => ({ ...p, caption: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as GalleryCategory }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isPublished} onCheckedChange={v => setForm(p => ({ ...p, isPublished: v }))} />
                <Label>Publish on website immediately</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={handleSave} disabled={saving}>
                <Upload className="h-4 w-4" /> {saving ? "Saving…" : "Add to Gallery"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Remove Photo</DialogTitle>
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
