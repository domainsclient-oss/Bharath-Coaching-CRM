"use client";

import { useState, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Edit, Trash2, FileText, Download, BookOpen, Video, Link2, Upload, Paperclip } from 'lucide-react';
import { SharedHeader } from "@/components/layout/shared-header";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { toast } from "@/hooks/use-toast";

type MaterialType = 'PDF' | 'Video' | 'Link' | 'Document';

interface StudyMaterial {
  id: string;
  title: string;
  subject: string;
  className: string;
  type: MaterialType;
  uploadedBy: string;
  uploadedDate: string;
  size: string;
  url: string;
  storagePath?: string;
  branchId: string;
}

const TYPE_ICONS: Record<MaterialType, React.ReactNode> = {
  PDF:      <FileText className="h-4 w-4 text-red-600" />,
  Video:    <Video    className="h-4 w-4 text-blue-600" />,
  Link:     <Link2    className="h-4 w-4 text-green-600" />,
  Document: <BookOpen className="h-4 w-4 text-yellow-600" />,
};

const TYPE_COLORS: Record<MaterialType, string> = {
  PDF:      'bg-red-100 text-red-700',
  Video:    'bg-blue-100 text-blue-700',
  Link:     'bg-green-100 text-green-700',
  Document: 'bg-yellow-100 text-yellow-700',
};

const ACCEPTED: Record<MaterialType, string> = {
  PDF:      '.pdf',
  Video:    '.mp4,.mov,.avi,.mkv,.webm',
  Document: '.doc,.docx,.ppt,.pptx,.xlsx,.xls,.txt',
  Link:     '',
};

const EMPTY = {
  title: '', subject: '', className: '',
  type: 'PDF' as MaterialType, uploadedBy: '', url: '',
};

export default function StudyMaterialsPage() {
  const { currentBranch } = useBranch();

  const { data: materials, loading } = useFirestoreCollection<StudyMaterial>("studyMaterials", currentBranch);

  const [search,       setSearch]       = useState('');
  const [filterClass,  setFilterClass]  = useState('all');
  const [filterType,   setFilterType]   = useState('all');
  const [showDialog,   setShowDialog]   = useState(false);
  const [editItem,     setEditItem]     = useState<StudyMaterial | null>(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<StudyMaterial | null>(null);
  const [deleting,     setDeleting]     = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const classes = useMemo(() => Array.from(new Set(materials.map(m => m.className))).sort(), [materials]);

  const filtered = useMemo(() => materials.filter(m => {
    const matchSearch = !search || m.title.toLowerCase().includes(search.toLowerCase()) || m.subject.toLowerCase().includes(search.toLowerCase());
    const matchClass  = filterClass === 'all' || m.className === filterClass;
    const matchType   = filterType  === 'all' || m.type      === filterType;
    return matchSearch && matchClass && matchType;
  }), [materials, search, filterClass, filterType]);

  const set = (k: string, v: string) => setForm(prev => ({ ...prev, [k]: v }));

  const resetDialog = () => {
    setForm(EMPTY);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openNew = () => { setEditItem(null); resetDialog(); setShowDialog(true); };
  const openEdit = (m: StudyMaterial) => {
    setEditItem(m);
    setForm({ title: m.title, subject: m.subject, className: m.className, type: m.type, uploadedBy: m.uploadedBy, url: m.url ?? '' });
    setSelectedFile(null);
    setShowDialog(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file && !form.title) setForm(p => ({ ...p, title: file.name.replace(/\.[^.]+$/, '') }));
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / 1024).toFixed(0) + ' KB';
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    if (form.type !== 'Link' && !editItem && !selectedFile) {
      toast({ title: "Please select a file to upload", variant: "destructive" });
      return;
    }
    if (form.type === 'Link' && !form.url.trim()) {
      toast({ title: "URL required for Link type", variant: "destructive" });
      return;
    }
    setSaving(true);

    let fileUrl   = editItem?.url         ?? '';
    let filePath  = editItem?.storagePath ?? '';
    let fileSize  = editItem?.size        ?? '—';

    if (selectedFile && form.type !== 'Link') {
      try {
        filePath = `studyMaterials/${currentBranch}/${Date.now()}_${selectedFile.name}`;
        const storageRef = ref(storage, filePath);
        const timeout = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('timeout')), 30000)
        );
        const snapshot = await Promise.race([uploadBytes(storageRef, selectedFile), timeout]) as Awaited<ReturnType<typeof uploadBytes>>;
        fileUrl  = await getDownloadURL(snapshot.ref);
        fileSize = formatSize(selectedFile.size);
      } catch {
        filePath = '';
        fileUrl  = '';
        fileSize = selectedFile ? formatSize(selectedFile.size) : '—';
        toast({
          title: "File not stored",
          description: "Deploy Firebase Storage rules to enable file uploads.",
        });
      }
    }

    try {
      const payload = {
        title:       form.title.trim(),
        subject:     form.subject.trim(),
        className:   form.className.trim(),
        type:        form.type,
        uploadedBy:  form.uploadedBy.trim(),
        url:         form.type === 'Link' ? form.url.trim() : (fileUrl || ''),
        storagePath: filePath || null,
        size:        fileSize,
        uploadedDate: editItem?.uploadedDate ?? new Date().toISOString().split('T')[0],
      };

      if (editItem) {
        await updateDocument("studyMaterials", editItem.id, payload);
        toast({ title: "Updated", description: form.title.trim() });
      } else {
        await addDocument("studyMaterials", { ...payload, branchId: currentBranch });
        toast({ title: "Material Added", description: form.title.trim() });
      }
      setShowDialog(false);
      resetDialog();
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("studyMaterials", deleteTarget.id);
      if (deleteTarget.storagePath) {
        try { await deleteObject(ref(storage, deleteTarget.storagePath)); } catch { /* ok */ }
      }
      toast({ title: "Deleted", description: `"${deleteTarget.title}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Study Materials" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500 overflow-x-hidden">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1E2A4A]">Study Materials</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Upload and manage study resources for students</p>
          </div>
          <Button onClick={openNew} className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90">
            <Plus className="h-4 w-4 mr-2" /> Add Material
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(['PDF', 'Video', 'Document', 'Link'] as MaterialType[]).map(type => (
            <Card key={type}>
              <CardContent className="p-4 flex items-center gap-3">
                {TYPE_ICONS[type]}
                <div>
                  {loading
                    ? <Skeleton className="h-6 w-6 mb-1" />
                    : <p className="text-xl font-bold">{materials.filter(m => m.type === type).length}</p>
                  }
                  <p className="text-xs text-muted-foreground">{type}s</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search by title or subject..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[150px]"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[140px]"><SelectValue placeholder="All Types" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="PDF">PDF</SelectItem>
                <SelectItem value="Video">Video</SelectItem>
                <SelectItem value="Document">Document</SelectItem>
                <SelectItem value="Link">Link</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader className="pb-2">
            {loading
              ? <Skeleton className="h-5 w-36" />
              : <CardTitle className="text-base">Materials ({filtered.length})</CardTitle>
            }
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {['Title', 'Subject', 'Class', 'Type', 'Uploaded By', 'Date', 'Size', 'Actions'].map(h => (
                      <th key={h} className="text-left px-4 py-3 font-semibold text-slate-700">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    [...Array(4)].map((_, i) => (
                      <tr key={i} className="border-b">
                        {[...Array(8)].map((__, j) => (
                          <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-10 text-muted-foreground">No materials found.</td></tr>
                  ) : filtered.map(m => (
                    <tr key={m.id} className="border-b hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {TYPE_ICONS[m.type]}
                          <span className="font-medium text-[#1E2A4A]">{m.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{m.subject}</td>
                      <td className="px-4 py-3">{m.className}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[m.type]}`}>{m.type}</span>
                      </td>
                      <td className="px-4 py-3">{m.uploadedBy}</td>
                      <td className="px-4 py-3">{m.uploadedDate}</td>
                      <td className="px-4 py-3">{m.size}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {m.url && (
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-[#0D7C8F]" asChild>
                              <a href={m.url} target="_blank" rel="noopener noreferrer"><Download className="h-3.5 w-3.5" /></a>
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(m)}>
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => setDeleteTarget(m)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Add / Edit Dialog */}
        <Dialog open={showDialog} onOpenChange={v => { if (!v) { setShowDialog(false); resetDialog(); } }}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editItem ? 'Edit Material' : 'Add Study Material'}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-2 gap-4 py-2">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={form.type} onValueChange={v => { set('type', v); setSelectedFile(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="Video">Video</SelectItem>
                    <SelectItem value="Document">Document</SelectItem>
                    <SelectItem value="Link">Link</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Uploaded By</Label>
                <Input value={form.uploadedBy} onChange={e => set('uploadedBy', e.target.value)} placeholder="Teacher name" />
              </div>

              {/* File upload or URL depending on type */}
              {form.type === 'Link' ? (
                <div className="col-span-2 space-y-1.5">
                  <Label>URL *</Label>
                  <Input value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://..." />
                </div>
              ) : (
                <div className="col-span-2 space-y-1.5">
                  <Label>File {!editItem && '*'}</Label>
                  <div
                    className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-[#0D7C8F] transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {selectedFile ? (
                      <div className="flex items-center justify-center gap-2 text-sm font-medium text-[#1E2A4A]">
                        <Paperclip className="h-4 w-4 text-[#0D7C8F]" />
                        {selectedFile.name}
                        <span className="text-xs text-muted-foreground">({formatSize(selectedFile.size)})</span>
                      </div>
                    ) : editItem?.url ? (
                      <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                        <Paperclip className="h-4 w-4" />
                        <span>File already uploaded — click to replace</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <Upload className="h-6 w-6 opacity-40" />
                        <p className="text-xs">Click to select a file</p>
                        <p className="text-xs text-slate-400">{ACCEPTED[form.type].replace(/,/g, ', ')}</p>
                      </div>
                    )}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED[form.type]}
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              )}

              <div className="col-span-2 space-y-1.5">
                <Label>Title *</Label>
                <Input value={form.title} onChange={e => set('title', e.target.value)} placeholder="Material title..." />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={form.subject} onChange={e => set('subject', e.target.value)} placeholder="e.g. Mathematics" />
              </div>
              <div className="space-y-1.5">
                <Label>Class</Label>
                <Input value={form.className} onChange={e => set('className', e.target.value)} placeholder="e.g. Class 10" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setShowDialog(false); resetDialog(); }}>Cancel</Button>
              <Button className="bg-[#0D7C8F] hover:bg-[#0D7C8F]/90 gap-2" onClick={handleSave} disabled={saving}>
                <Upload className="h-4 w-4" />
                {saving ? 'Uploading…' : editItem ? 'Update' : 'Add Material'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader><DialogTitle>Delete Study Material</DialogTitle></DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete <span className="font-semibold text-foreground">&quot;{deleteTarget?.title}&quot;</span>? This cannot be undone.
            </p>
            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>
    </div>
  );
}
