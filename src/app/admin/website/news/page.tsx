"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, Plus, Trash2, Edit2, Newspaper,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { NewsCategory } from "@/data/websiteData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface WebsiteNews {
  id: string;
  title: string;
  content: string;
  category: NewsCategory;
  author: string;
  publishedAt: string;
  isPublished: boolean;
  branchId: string;
}

const CATEGORIES: NewsCategory[] = ["Achievement", "Announcement", "Result", "Admission", "General"];

const CAT_COLORS: Record<NewsCategory, string> = {
  Achievement:  "bg-amber-100 text-amber-700",
  Announcement: "bg-blue-100 text-blue-700",
  Result:       "bg-green-100 text-green-700",
  Admission:    "bg-purple-100 text-purple-700",
  General:      "bg-slate-100 text-slate-600",
};

const BLANK = {
  title: "", content: "", category: "Announcement" as NewsCategory,
  author: "Admin", publishedAt: new Date().toISOString().slice(0, 10), isPublished: true,
};

export default function NewsPage() {
  const { currentBranch } = useBranch();

  const { data: newsList, loading } = useFirestoreCollection<WebsiteNews>("websiteNews", currentBranch);

  const [catFilter,    setCatFilter]    = useState("All");
  const [showForm,     setShowForm]     = useState(false);
  const [editing,      setEditing]      = useState<WebsiteNews | null>(null);
  const [form,         setForm]         = useState({ ...BLANK });
  const [saving,       setSaving]       = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<WebsiteNews | null>(null);
  const [deleting,     setDeleting]     = useState(false);

  const filtered = useMemo(() =>
    newsList
      .filter(n => catFilter === "All" || n.category === catFilter)
      .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)),
    [newsList, catFilter],
  );

  const publishedCount = filtered.filter(n => n.isPublished).length;

  const openAdd = () => {
    setEditing(null);
    setForm({ ...BLANK, publishedAt: new Date().toISOString().slice(0, 10) });
    setShowForm(true);
  };

  const openEdit = (n: WebsiteNews) => {
    setEditing(n);
    setForm({ title: n.title, content: n.content, category: n.category, author: n.author, publishedAt: n.publishedAt, isPublished: n.isPublished });
    setShowForm(true);
  };

  const togglePublish = async (n: WebsiteNews) => {
    try {
      await updateDocument("websiteNews", n.id, { isPublished: !n.isPublished });
    } catch {
      toast({ title: "Error", description: "Failed to update.", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteDocument("websiteNews", deleteTarget.id);
      toast({ title: "Deleted", description: `"${deleteTarget.title}" removed.` });
      setDeleteTarget(null);
    } catch {
      toast({ title: "Error", description: "Failed to delete.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      toast({ title: "Title required", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("websiteNews", editing.id, {
          title:       form.title.trim(),
          content:     form.content.trim(),
          category:    form.category,
          author:      form.author.trim() || "Admin",
          publishedAt: form.publishedAt,
          isPublished: form.isPublished,
        });
        toast({ title: "News Updated", description: form.title.trim() });
      } else {
        await addDocument("websiteNews", {
          title:       form.title.trim(),
          content:     form.content.trim(),
          category:    form.category,
          author:      form.author.trim() || "Admin",
          publishedAt: form.publishedAt,
          isPublished: form.isPublished,
          branchId:    currentBranch,
        });
        toast({ title: "News Added", description: form.title.trim() });
      }
      setShowForm(false);
    } catch {
      toast({ title: "Error", description: "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="News" />
      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">

        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">News</span>
        </div>

        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-[#1E2A4A]">News & Updates</h2>
            {loading
              ? <Skeleton className="h-4 w-36 mt-1" />
              : <p className="text-sm text-muted-foreground">{publishedCount} published · {filtered.length} total</p>
            }
          </div>
          <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add News
          </Button>
        </div>

        {/* Category pills */}
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

        {/* News list */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="border-none shadow-sm">
                <CardContent className="p-5 space-y-2">
                  <div className="flex gap-2">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <Card className="border-none shadow-sm">
            <CardContent className="h-40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
              <Newspaper className="h-8 w-8 opacity-20" />
              <p>No news articles found. Click &quot;Add News&quot; to create one.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map(n => (
              <Card key={n.id} className={`border-none shadow-sm ${!n.isPublished ? "opacity-60" : ""}`}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={`text-xs ${CAT_COLORS[n.category]}`}>{n.category}</Badge>
                        {!n.isPublished && <Badge variant="outline" className="text-xs text-slate-400">Draft</Badge>}
                        <span className="text-xs text-muted-foreground">{n.publishedAt} · by {n.author}</span>
                      </div>
                      <h3 className="font-bold text-[#1E2A4A]">{n.title}</h3>
                      {n.content && <p className="text-sm text-muted-foreground line-clamp-2">{n.content}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Switch checked={n.isPublished} onCheckedChange={() => togglePublish(n)} className="scale-75" />
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(n)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-400 hover:text-red-600"
                        onClick={() => setDeleteTarget(n)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Add / Edit Dialog */}
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Edit News" : "Add News Article"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-1.5">
                <Label>Headline *</Label>
                <Input placeholder="e.g. 3 Students Score 720 in NEET 2026" value={form.title}
                  onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Content</Label>
                <Textarea rows={4} placeholder="Write the news content..." value={form.content}
                  onChange={e => setForm(p => ({ ...p, content: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select value={form.category} onValueChange={v => setForm(p => ({ ...p, category: v as NewsCategory }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Author</Label>
                  <Input value={form.author}
                    onChange={e => setForm(p => ({ ...p, author: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Publish Date</Label>
                <Input type="date" value={form.publishedAt}
                  onChange={e => setForm(p => ({ ...p, publishedAt: e.target.value }))} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.isPublished} onCheckedChange={v => setForm(p => ({ ...p, isPublished: v }))} />
                <Label>Publish on website</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F]" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editing ? "Save Changes" : "Publish News"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

      </main>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Delete Article</DialogTitle>
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
