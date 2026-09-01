"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  ChevronRight, PlusCircle, Search, Edit, Trash2,
  BookOpen, BookCopy, BookX, Library, Tag,
} from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { BOOK_CATEGORIES } from "@/data/libraryData";
import { useBranch } from "@/context/BranchContext";
import { useFirestoreCollection } from "@/hooks/useFirestoreCollection";
import { addDocument, updateDocument, deleteDocument } from "@/services/firestoreService";
import { toast } from "@/hooks/use-toast";

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  publisher: string;
  publishedYear: number;
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  branchId: string;
}

const CATEGORY_COLORS: Record<string, string> = {
  "Science":          "bg-blue-100 text-blue-700",
  "Mathematics":      "bg-purple-100 text-purple-700",
  "Literature":       "bg-rose-100 text-rose-700",
  "History":          "bg-amber-100 text-amber-700",
  "Computer Science": "bg-teal-100 text-teal-700",
  "Reference":        "bg-slate-100 text-slate-700",
  "Language":         "bg-green-100 text-green-700",
  "Arts":             "bg-orange-100 text-orange-700",
};

const EMPTY = {
  title: "", author: "", isbn: "", category: "Science",
  publisher: "", publishedYear: new Date().getFullYear(),
  totalCopies: 1, availableCopies: 1, shelfLocation: "",
};

export default function BookListPage() {
  const { currentBranch } = useBranch();

  const { data: books, loading } = useFirestoreCollection<Book>("books", currentBranch);

  const [search,     setSearch]     = useState("");
  const [catFilter,  setCatFilter]  = useState("all");
  const [isOpen,     setIsOpen]     = useState(false);
  const [editing,    setEditing]    = useState<Book | null>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const kpi = useMemo(() => ({
    total:       books.length,
    totalCopies: books.reduce((s, b) => s + (b.totalCopies     ?? 0), 0),
    available:   books.reduce((s, b) => s + (b.availableCopies ?? 0), 0),
    issued:      books.reduce((s, b) => s + ((b.totalCopies ?? 0) - (b.availableCopies ?? 0)), 0),
  }), [books]);

  const filtered = useMemo(() =>
    books.filter(b =>
      (catFilter === "all" || b.category === catFilter) &&
      (
        b.title.toLowerCase().includes(search.toLowerCase()) ||
        b.author.toLowerCase().includes(search.toLowerCase()) ||
        (b.isbn ?? "").includes(search)
      )
    ), [books, search, catFilter]);

  const openAdd = () => { setEditing(null); setForm(EMPTY); setIsOpen(true); };
  const openEdit = (b: Book) => {
    setEditing(b);
    setForm({
      title: b.title, author: b.author, isbn: b.isbn ?? "", category: b.category,
      publisher: b.publisher ?? "", publishedYear: b.publishedYear ?? new Date().getFullYear(),
      totalCopies: b.totalCopies ?? 1, availableCopies: b.availableCopies ?? 1,
      shelfLocation: b.shelfLocation ?? "",
    });
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.author.trim()) {
      toast({ title: "Title and Author are required.", variant: "destructive" }); return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateDocument("books", editing.id, { ...form });
        toast({ title: "Book Updated", description: `"${form.title}" updated.` });
      } else {
        await addDocument("books", { ...form, branchId: currentBranch });
        toast({ title: "Book Added", description: `"${form.title}" added to the library.` });
      }
      setIsOpen(false);
    } catch {
      toast({ title: "Error", description: "Failed to save book.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!deletingId) return;
    setDeleting(true);
    try {
      await deleteDocument("books", deletingId);
      toast({ title: "Book Removed", variant: "destructive" });
      setDeletingId(null);
    } catch {
      toast({ title: "Error", description: "Failed to remove book.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  const f = (k: keyof typeof form, v: string | number) =>
    setForm(prev => ({ ...prev, [k]: v }));

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Book List" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/library" className="hover:text-[#0D7C8F]">Library</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Book List</span>
        </div>

        {/* KPI cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Titles",  value: kpi.total,       icon: Library,  color: "text-[#1E2A4A]", bg: "bg-blue-100"  },
            { label: "Total Copies",  value: kpi.totalCopies, icon: BookCopy, color: "text-blue-600",  bg: "bg-blue-100"  },
            { label: "Available",     value: kpi.available,   icon: BookOpen, color: "text-green-600", bg: "bg-green-100" },
            { label: "Issued Out",    value: kpi.issued,      icon: BookX,    color: "text-red-500",   bg: "bg-red-100"   },
          ].map(c => {
            const Icon = c.icon;
            return (
              <Card key={c.label} className="border-none shadow-sm">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-full ${c.bg} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`h-5 w-5 ${c.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">{c.label}</p>
                    {loading
                      ? <Skeleton className="h-7 w-10 mt-1" />
                      : <p className={`text-2xl font-bold ${c.color}`}>{c.value}</p>
                    }
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Filters + Add */}
        <Card className="border-none shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-48">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Search by title, author or ISBN..." className="pl-9"
                  value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger className="w-44"><SelectValue placeholder="All Categories" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {BOOK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button className="bg-[#1E2A4A] hover:bg-[#0D7C8F] gap-2" onClick={openAdd}>
                <PlusCircle className="h-4 w-4" /> Add Book
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-white border-b py-3 px-6">
            <CardTitle className="text-base font-bold text-[#1E2A4A]">
              {loading ? "Loading…" : `Book Catalogue — ${filtered.length} title${filtered.length !== 1 ? "s" : ""}`}
            </CardTitle>
          </CardHeader>
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-8 text-center">#</TableHead>
                <TableHead>Title / Author</TableHead>
                <TableHead className="w-40">Category</TableHead>
                <TableHead className="w-36">ISBN</TableHead>
                <TableHead className="w-20 text-center">Copies</TableHead>
                <TableHead className="w-24 text-center">Available</TableHead>
                <TableHead className="w-24 text-center">Shelf</TableHead>
                <TableHead className="w-20 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, i) => (
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
                      <BookOpen className="h-8 w-8 mx-auto opacity-20" />
                      <p>No books found{search || catFilter !== "all" ? " matching your filters" : `. Click "Add Book" to add one.`}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filtered.map((book, idx) => (
                <TableRow key={book.id} className="hover:bg-slate-50/50">
                  <TableCell className="text-center text-xs text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell>
                    <p className="font-semibold text-[#1E2A4A] text-sm">{book.title}</p>
                    <p className="text-[11px] text-muted-foreground">{book.author} · {book.publishedYear}</p>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${CATEGORY_COLORS[book.category] ?? "bg-slate-100 text-slate-700"}`}>
                      {book.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-mono text-muted-foreground">{book.isbn || "—"}</TableCell>
                  <TableCell className="text-center font-semibold">{book.totalCopies ?? 0}</TableCell>
                  <TableCell className="text-center">
                    <span className={`font-bold text-sm ${
                      (book.availableCopies ?? 0) === 0 ? "text-red-500" :
                      (book.availableCopies ?? 0) <= 2  ? "text-amber-600" : "text-green-600"}`}>
                      {book.availableCopies ?? 0}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    {book.shelfLocation
                      ? <Badge variant="outline" className="text-xs font-mono"><Tag className="h-3 w-3 mr-1" />{book.shelfLocation}</Badge>
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600 hover:bg-amber-50 hover:text-amber-700" onClick={() => openEdit(book)}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:bg-red-50 hover:text-red-600" onClick={() => setDeletingId(book.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </main>

      {/* Add / Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={v => { if (!v) setIsOpen(false); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">{editing ? "Edit Book" : "Add New Book"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2 space-y-1">
              <Label className="text-xs font-semibold">Book Title *</Label>
              <Input placeholder="e.g. NCERT Mathematics Class 10" value={form.title} onChange={e => f("title", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Author *</Label>
              <Input placeholder="Author name" value={form.author} onChange={e => f("author", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">ISBN</Label>
              <Input placeholder="978-xx-xxxx-xxx-x" value={form.isbn} onChange={e => f("isbn", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Category</Label>
              <Select value={form.category} onValueChange={v => f("category", v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {BOOK_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Publisher</Label>
              <Input placeholder="Publisher name" value={form.publisher} onChange={e => f("publisher", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Published Year</Label>
              <Input type="number" min={1900} max={2030} value={form.publishedYear} onChange={e => f("publishedYear", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Shelf Location</Label>
              <Input placeholder="e.g. A-01" value={form.shelfLocation} onChange={e => f("shelfLocation", e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Total Copies</Label>
              <Input type="number" min={1} value={form.totalCopies} onChange={e => f("totalCopies", Number(e.target.value))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-semibold">Available Copies</Label>
              <Input type="number" min={0} max={form.totalCopies} value={form.availableCopies} onChange={e => f("availableCopies", Number(e.target.value))} />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
            <Button className="bg-[#0D7C8F] hover:bg-[#1E2A4A]" onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : editing ? "Save Changes" : "Add Book"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deletingId} onOpenChange={v => { if (!v) setDeletingId(null); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-[#1E2A4A]">Remove Book</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This will remove the book from the catalogue. This action cannot be undone.</p>
          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setDeletingId(null)}>Cancel</Button>
            <Button variant="destructive" onClick={doDelete} disabled={deleting}>
              {deleting ? "Removing…" : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
