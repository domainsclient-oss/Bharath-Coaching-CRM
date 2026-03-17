
'use client';

import { useState, useEffect } from 'react';
import { studentVideoHistoryService, studentVideoBookmarksService } from '../../../services/firestoreService';
import { useAuth } from '../../../context/AuthContext';
import { videoData, Video } from '../../../data/studentData';
import { Card, CardContent } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { PlayCircle, Bookmark, History } from 'lucide-react';
import { Skeleton } from '../../../components/ui/skeleton';

export default function VideosPage() {
  const [watchHistory, setWatchHistory] = useState<string[]>([]);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const studentId = user?.id;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setError("Please log in to view video data.");
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch both history and bookmarks
        const historyDoc = await studentVideoHistoryService.getById(studentId);
        const bookmarksDoc = await studentVideoBookmarksService.getById(studentId);

        if (historyDoc && historyDoc.data) {
          setWatchHistory(historyDoc.data as string[]);
        }
        if (bookmarksDoc && bookmarksDoc.data) {
          setBookmarks(bookmarksDoc.data as string[]);
        }

      } catch (err) {
        setError('Failed to load your video data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [studentId]);

  const handlePlayVideo = async (videoId: string) => {
    if (!studentId) return;

    const newHistory = [...new Set([videoId, ...watchHistory])]; // Add to front, ensure unique
    setWatchHistory(newHistory);

    try {
      await studentVideoHistoryService.set(studentId, { data: newHistory });
    } catch (err) {
      console.error("Failed to save watch history:", err);
      setError("Could not update your watch history.");
      setWatchHistory(watchHistory); // Revert state
    }
  };

  const toggleBookmark = async (videoId: string) => {
    if (!studentId) return;

    const isBookmarked = bookmarks.includes(videoId);
    const newBookmarks = isBookmarked
      ? bookmarks.filter(id => id !== videoId)
      : [...bookmarks, videoId];
    
    setBookmarks(newBookmarks);

    try {
      await studentVideoBookmarksService.set(studentId, { data: newBookmarks });
    } catch (err) {
      console.error("Failed to save bookmarks:", err);
      setError("Could not update your bookmarks.");
      setBookmarks(bookmarks); // Revert state
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Video Library</h1>

      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900 p-4 rounded-md">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
            [...Array(6)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <Skeleton className="h-40 w-full mb-4" />
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-1/2" />
                    </CardContent>
                </Card>
            ))
        ) : (videoData.map((video: Video) => (
          <Card key={video.id} className="bg-white dark:bg-gray-800 shadow-md rounded-lg overflow-hidden">
            <div className="relative">
              <img src={video.thumbnailUrl} alt={video.title} className="w-full h-40 object-cover" />
              <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                <Button variant="ghost" size="icon" onClick={() => handlePlayVideo(video.id)}>
                  <PlayCircle className="h-12 w-12 text-white" />
                </Button>
              </div>
              {watchHistory.includes(video.id) && (
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs font-bold px-2 py-1 rounded flex items-center">
                      <History className="h-3 w-3 mr-1"/> Watched
                  </div>
              )}
            </div>
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{video.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{video.subject}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4 w-full" 
                onClick={() => toggleBookmark(video.id)}
              >
                <Bookmark className={`h-4 w-4 mr-2 ${bookmarks.includes(video.id) ? 'fill-yellow-400 text-yellow-500' : ''}`} />
                {bookmarks.includes(video.id) ? 'Bookmarked' : 'Bookmark'}
              </Button>
            </CardContent>
          </Card>
        )))}
      </div>
    </div>
  );
}
