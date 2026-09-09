"use client";

import { useEffect, useState, useMemo } from 'react';
import { queryDocuments } from "@/services/firestoreService";
import { useStudentRecord } from "@/hooks/useStudentRecord";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Tag, User } from 'lucide-react';

/**
 * Announcements are the news items published from the admin Website section,
 * stored in `websiteNews`. Only published items reach students.
 */
interface NewsItem {
  id: string;
  title: string;
  content?: string;
  category?: string;
  author?: string;
  publishedAt?: string;
  isPublished?: boolean;
  branchId?: string;
}

const NoticesPage = () => {
    const { branchId, loading: recordLoading } = useStudentRecord();
    const [notices, setNotices] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("All");

    useEffect(() => {
        if (recordLoading) return;

        const load = async () => {
            setLoading(true);
            try {
                const rows = await queryDocuments<NewsItem>(
                    "websiteNews",
                    branchId ? [{ field: "branchId", operator: "==", value: branchId }] : [],
                );
                const published = (rows as NewsItem[]).filter(n => n.isPublished !== false);
                published.sort((a, b) =>
                    String(b.publishedAt ?? '').localeCompare(String(a.publishedAt ?? ''))
                );
                setNotices(published);
            } catch (err) {
                console.error("Failed to load announcements:", err);
                setNotices([]);
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [branchId, recordLoading]);

    const categories = useMemo(
        () => ["All", ...Array.from(new Set(notices.map(n => n.category).filter(Boolean) as string[]))],
        [notices]
    );

    const filtered = useMemo(
        () => filter === "All" ? notices : notices.filter(n => n.category === filter),
        [notices, filter]
    );

    const NoticeCard = ({ notice }: { notice: NewsItem }) => {
        const published = notice.publishedAt ? new Date(notice.publishedAt) : null;
        const validDate = published && !isNaN(published.getTime()) ? published : null;

        return (
            <Card className="relative transition-all hover:shadow-lg">
                <CardHeader>
                    <CardTitle className="text-lg pr-8">{notice.title}</CardTitle>
                    <div className="flex items-center text-xs text-muted-foreground pt-1 space-x-4 flex-wrap gap-y-1">
                        {validDate && (
                          <div className="flex items-center">
                            <Calendar className="h-3.5 w-3.5 mr-1.5" />
                            {validDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                          </div>
                        )}
                        {notice.category && (
                          <div className="flex items-center">
                            <Tag className="h-3.5 w-3.5 mr-1.5" /><Badge variant="secondary">{notice.category}</Badge>
                          </div>
                        )}
                        {notice.author && (
                          <div className="flex items-center">
                            <User className="h-3.5 w-3.5 mr-1.5" />Posted by: {notice.author}
                          </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-line">{notice.content}</p>
                </CardContent>
            </Card>
        );
    };

    const busy = loading || recordLoading;

    return (
        <div className="space-y-6 p-4 md:p-6 lg:p-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Notices &amp; Announcements</h1>
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
                {busy ? (
                    [...Array(3)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)
                ) : filtered.length > 0 ? (
                    filtered.map(notice => <NoticeCard key={notice.id} notice={notice} />)
                ) : (
                    <div className="text-center py-16">
                        <p className="text-muted-foreground">No announcements have been published yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default NoticesPage;
