'use client';

import { useState, useEffect } from 'react';
import { userService } from '../../../services/firestoreService';
import { useAuth } from '../../../context/AuthContext'; // To get the logged-in user
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Label } from '../../../components/ui/label';
import { Switch } from '../../../components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Button } from '../../../components/ui/button';
import { Skeleton } from '../../../components/ui/skeleton';
import { toast } from '@/hooks/use-toast';

interface StudentSettings {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<StudentSettings>({ theme: 'system', notifications: true });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !user.id) {
      setLoading(false);
      setError("You must be logged in to manage settings.");
      return;
    }

    const fetchSettings = async () => {
      try {
        setLoading(true);
        const userDoc = await userService.getById(user.id);
        if (userDoc && userDoc.settings) {
          setSettings(userDoc.settings as StudentSettings);
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
        setError('Could not load your settings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [user]);

  const handleSave = async () => {
    if (!user || !user.id) {
        toast({ title: "Error", description: "You are not logged in.", variant: "destructive" });
        return;
    }

    setIsSaving(true);
    try {
        // We use the update method to merge the settings field into the user document
        await userService.update(user.id, { settings: settings });
        toast({ title: "Success!", description: "Your settings have been saved." });
    } catch (err) {
        console.error('Failed to save settings:', err);
        toast({ title: "Error", description: "Failed to save settings. Please try again.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  const handleSettingChange = (key: keyof StudentSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
        <div className="container mx-auto p-6">
            <Skeleton className="h-8 w-1/3 mb-6" />
            <Card>
                <CardHeader><Skeleton className="h-6 w-1/4" /></CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-8 w-1/4" /></div>
                    <div className="flex items-center justify-between"><Skeleton className="h-5 w-1/4" /><Skeleton className="h-8 w-1/4" /></div>
                    <Skeleton className="h-10 w-full mt-4" />
                </CardContent>
            </Card>
        </div>
    )
  }

  if (error) {
    return <div className="container mx-auto p-6"><p className="text-red-500">{error}</p></div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-white">Settings</h1>
      <Card className="max-w-2xl mx-auto bg-white dark:bg-gray-800 shadow-lg rounded-lg">
        <CardHeader>
          <CardTitle>Appearance & Notifications</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme-select" className="text-lg">Theme</Label>
            <Select 
              value={settings.theme}
              onValueChange={(value) => handleSettingChange('theme', value)}
            >
              <SelectTrigger id="theme-select" className="w-[180px]">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="notif-switch" className="text-lg">Enable Notifications</Label>
            <Switch 
              id="notif-switch" 
              checked={settings.notifications}
              onCheckedChange={(checked) => handleSettingChange('notifications', checked)}
            />
          </div>

          <Button onClick={handleSave} disabled={isSaving} className="w-full mt-4">
            {isSaving ? 'Saving...' : 'Save Preferences'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
