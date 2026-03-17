
"use client";

import { useState, useMemo } from 'react';
import { mockAnnouncements, Announcement } from "@/data/announcementsData";
import { mockStudentProfile } from "@/data/studentPortalData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Pin, Calendar, Tag, User } from 'lucide-react';

const NoticesPage = () => {
    const studentClass = mockStudentProfile.class;
    const [filter, setFilter] = useState("All");

    const filteredAnnouncements = useMemo(() => {
        const studentAnnouncements = mockAnnouncements.filter(a => 
            a.branchId === "BR001" && (a.targetClass === "All" || a.targetClass === studentClass)
        );

        const sorted = studentAnnouncements.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        
        if (filter === "All") {
            return sorted;
        }
        return sorted.filter(a => a.category === filter);
    }, [studentClass, filter]);

    const categories = useMemo(() => {
        const allCategories = mockAnnouncements.map(a => a.category);
        return ["All", ...Array.from(new Set(allCategories))];
    }, []);

    const NoticeCard = ({ notice }: { notice: Announcement }) => (
        <Card className={`relative transition-all hover:shadow-lg ${notice.pinned ? 'bg-amber-50/50 border-amber-200' : ''}`}>
            {notice.pinned && <Pin className="absolute top-3 right-3 h-5 w-5 text-amber-500 fill-amber-400" />}
            <CardHeader>
                <CardTitle className="text-lg pr-8">{notice.title}</CardTitle>
                <div className="flex items-center text-xs text-muted-foreground pt-1 space-x-4">
                    <div className="flex items-center"><Calendar className="h-3.5 w-3.5 mr-1.5" />{new Date(notice.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                    <div className="flex items-center"><Tag className="h-3.5 w-3.5 mr-1.5" /><Badge variant="secondary">{notice.category}</Badge></div>
                    <div className="flex items-center"><User className="h-3.5 w-3.5 mr-1.5" />Posted by: {notice.postedBy}</div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">{notice.body}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Notices & Announcements</h1>
                    <p className="text-muted-foreground">Stay updated with the latest news from the academy.</p>
                </div>
                <div className="w-48">
                    <Select value={filter} onValueChange={setFilter}>
                        <SelectTrigger>
                            <SelectValue placeholder="Filter by category..." />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="space-y-4">
                {filteredAnnouncements.length > 0 ? (
                    filteredAnnouncements.map(notice => <NoticeCard key={notice.id} notice={notice} />)
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No announcements found for the selected category.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NoticesPage;
