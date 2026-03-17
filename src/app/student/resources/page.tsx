
"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { mockResources, Resource } from "@/data/studentPortalData";
import { mockStudentProfile } from "@/data/studentPortalData"; // To get current student's class
import { Download, FileText, Presentation, FileQuestion } from 'lucide-react';

const ResourceLibraryPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSubject, setSelectedSubject] = useState("all");

  // In a real app, this would come from a user context
  const studentClass = mockStudentProfile.class;

  const filteredResources = useMemo(() => {
    return mockResources
      .filter(r => r.visibleToStudents && r.class === studentClass) // Filter for student's class
      .filter(r => 
        searchTerm === "" || 
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subject.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(r => selectedSubject === "all" || r.subject === selectedSubject);
  }, [searchTerm, selectedSubject, studentClass]);

  const subjects = useMemo(() => {
    const allSubjects = mockResources
        .filter(r => r.visibleToStudents && r.class === studentClass)
        .map(r => r.subject);
    return ["all", ...Array.from(new Set(allSubjects))];
  }, [studentClass]);
  
  const getIconForType = (type: Resource['type']) => {
      switch(type) {
          case 'PDF': return <FileText className="h-5 w-5 text-red-500"/>;
          case 'Notes': return <FileText className="h-5 w-5 text-blue-500"/>;
          case 'Presentation': return <Presentation className="h-5 w-5 text-yellow-500"/>;
          case 'Question Bank': return <FileQuestion className="h-5 w-5 text-green-500"/>;
          default: return <FileText className="h-5 w-5"/>;
      }
  }

  return (
    <div className="space-y-6">
        <div>
            <h1 className="text-2xl font-bold">Resource Library</h1>
            <p className="text-muted-foreground">
                Find and download study materials shared by your teachers.
            </p>
        </div>

        <Card>
            <CardContent className="pt-6">
                <div className="flex flex-col md:flex-row gap-4 justify-between">
                    <Input 
                        placeholder="Search by title or subject..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="max-w-sm"
                    />
                    <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                        <SelectTrigger className="w-full md:w-[200px]">
                            <SelectValue placeholder="Filter by subject" />
                        </SelectTrigger>
                        <SelectContent>
                            {subjects.map(subject => (
                                <SelectItem key={subject} value={subject}>
                                    {subject === 'all' ? 'All Subjects' : subject}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50px]"></TableHead>
                            <TableHead>Title</TableHead>
                            <TableHead>Subject</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead className="text-right">Action</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredResources.length > 0 ? filteredResources.map(resource => (
                            <TableRow key={resource.id}>
                                <TableCell>{getIconForType(resource.type)}</TableCell>
                                <TableCell className="font-medium">{resource.title}</TableCell>
                                <TableCell>{resource.subject}</TableCell>
                                <TableCell>{resource.type}</TableCell>
                                <TableCell className="text-right">
                                    <Button variant="outline" size="sm" asChild>
                                        <a href={resource.fileUrl} download>
                                            <Download className="mr-2 h-4 w-4" />
                                            Download
                                        </a>
                                    </Button>
                                </TableCell>
                            </TableRow>
                        )) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No resources found for your class.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}

export default ResourceLibraryPage;
