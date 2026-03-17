
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { mockResources, Resource } from "@/data/studentPortalData";
import { mockStudentProfile } from "@/data/studentPortalData";
import { Download, Eye, FileText } from 'lucide-react';

const questionPaperTypes = ["Board Exam", "Unit Test", "Sample Paper", "Mock Test"];

const QuestionPapersPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const studentClass = mockStudentProfile.class;

  const papers = useMemo(() => {
    return mockResources.filter(
      (r) => r.visibleToStudents && r.class === studentClass && questionPaperTypes.includes(r.type)
    ) as (Resource & { year: number })[];
  }, [studentClass]);

  const filteredPapers = useMemo(() => {
    return papers
      .filter(p => searchTerm === "" || p.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(p => selectedSubject === "all" || p.subject === selectedSubject)
      .filter(p => selectedYear === "all" || p.year === parseInt(selectedYear))
      .filter(p => selectedType === "all" || p.type === selectedType);
  }, [papers, searchTerm, selectedSubject, selectedYear, selectedType]);

  const subjects = useMemo(() => ["all", ...Array.from(new Set(papers.map(p => p.subject)))], [papers]);
  const years = useMemo(() => ["all", ...Array.from(new Set(papers.map(p => p.year.toString())))].sort().reverse(), [papers]);
  const types = useMemo(() => ["all", ...questionPaperTypes], []);

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Question Papers</h1>
            <p className="text-muted-foreground">Browse and download past exam papers.</p>
        </div>

        <Card>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input 
                    placeholder="Search by title..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger><SelectValue placeholder="Filter by subject" /></SelectTrigger>
                    <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s === 'all' ? 'All Subjects' : s}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                    <SelectTrigger><SelectValue placeholder="Filter by year" /></SelectTrigger>
                    <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y === 'all' ? 'All Years' : y}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                    <SelectTrigger><SelectValue placeholder="Filter by type" /></SelectTrigger>
                    <SelectContent>{types.map(t => <SelectItem key={t} value={t}>{t === 'all' ? 'All Types' : t}</SelectItem>)}</SelectContent>
                </Select>
            </CardContent>
        </Card>

        <Card>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Year</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredPapers.length > 0 ? filteredPapers.map(paper => (
                            <TableRow key={paper.id}>
                                <TableCell className="font-medium flex items-center"><FileText className="h-4 w-4 mr-2 text-muted-foreground"/>{paper.title}</TableCell>
                                <TableCell>{paper.subject}</TableCell>
                                <TableCell>{paper.type}</TableCell>
                                <TableCell>{paper.year}</TableCell>
                                <TableCell className="text-right space-x-2">
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm"><Eye className="mr-2 h-4 w-4"/>Preview</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-4xl h-[90vh]">
                                            <DialogHeader><DialogTitle>{paper.title}</DialogTitle></DialogHeader>
                                            <iframe src={paper.fileUrl} className="w-full h-full" />
                                        </DialogContent>
                                    </Dialog>
                                    <Button size="sm" asChild>
                                        <a href={paper.fileUrl} download><Download className="mr-2 h-4 w-4"/>Download</a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow><TableCell colSpan={5} className="h-24 text-center">No question papers found.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

export default QuestionPapersPage;
