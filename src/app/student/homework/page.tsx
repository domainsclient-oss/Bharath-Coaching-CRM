
'use client';

import { useState, useEffect } from 'react';
import { studentHomeworkService } from '../../../services/firestoreService';
import { useAuth } from '../../../context/AuthContext'; // Assuming you have an AuthContext to get the studentId
import { homeworkData, HomeworkItem } from '../../../data/studentData'; // Assuming you get homework list from here
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Checkbox } from '../../../components/ui/checkbox';
import { Skeleton } from '../../../components/ui/skeleton';

export default function HomeworkPage() {
  const [completed, setCompleted] = useState<{[key: string]: boolean}>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Get the current user

  // This would be your student's unique ID. 
  // In a real app, you'd get this from your auth context.
  const studentId = user?.id;

  useEffect(() => {
    if (!studentId) {
      setLoading(false);
      setError("Please log in to view homework.");
      return;
    }

    const fetchCompletionData = async () => {
      try {
        setLoading(true);
        const doc = await studentHomeworkService.getById(studentId);
        if (doc && doc.data) {
          setCompleted(doc.data as {[key: string]: boolean});
        }
      } catch (err) {
        setError('Failed to load your homework data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchCompletionData();
  }, [studentId]);

  const toggleCompletion = async (hwId: string) => {
    if (!studentId) return;

    const newCompleted = { ...completed, [hwId]: !completed[hwId] };
    setCompleted(newCompleted);

    try {
      // Use the set method to create or overwrite a document for the student
      await studentHomeworkService.set(studentId, { data: newCompleted });
    } catch (err) {
      console.error('Failed to save completion status:', err);
      setError('Could not save your changes. Please check your connection.');
      // Optionally revert the state
      setCompleted(completed);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">My Homework</h1>
      
      {error && <p className="text-red-500 bg-red-100 dark:bg-red-900 p-4 rounded-md">{error}</p>}

      <Card className="bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Pending Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <ul className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <li key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-6 w-6 rounded" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <ul className="space-y-4">
              {homeworkData.map((hw: HomeworkItem) => (
                <li key={hw.id} className="flex items-center space-x-4 p-2 rounded-md transition-colors hover:bg-gray-100 dark:hover:bg-gray-700">
                  <Checkbox
                    id={`hw-${hw.id}`}
                    checked={completed[hw.id] || false}
                    onCheckedChange={() => toggleCompletion(hw.id)}
                    className="h-6 w-6 border-gray-300 dark:border-gray-600 rounded"
                  />
                  <label htmlFor={`hw-${hw.id}`} className="flex-1 cursor-pointer">
                    <p className={`font-medium ${completed[hw.id] ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                      {hw.subject}: {hw.title}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Due: {hw.dueDate}</p>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
