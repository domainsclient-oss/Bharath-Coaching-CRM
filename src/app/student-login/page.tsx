'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../../lib/auth-context';
import { releaseUiLock } from '../../lib/release-ui-lock';
import { normalizeRollNo, rollNoToEmail } from '../../lib/studentAuth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useSettings } from '../../context/SettingsContext';

export default function StudentLoginPage() {
  const [rollNo, setRollNo] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Same reason as /login: clear any body lock leaked by a modal on the page we
  // came from, otherwise these inputs are unfocusable until a refresh.
  useEffect(() => {
    releaseUiLock();
  }, []);

  const getAuthErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
      case 'auth/invalid-email':
        return 'Invalid roll number or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please try again later or ask your branch office to reset your password.';
      case 'auth/user-disabled':
        return 'This account has been disabled. Please contact your branch office.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizeRollNo(rollNo) || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both your roll number and password.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await login(rollNoToEmail(rollNo), password);
      toast({
        title: 'Login Successful',
        description: `Welcome to the ${settings.appName} student portal. Redirecting...`,
      });
    } catch (error: any) {
      console.error('Student login failed:', error);
      toast({
        title: 'Login Failed',
        description: getAuthErrorMessage(error?.code),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 flex-col gap-6">
      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex items-center justify-center">
            <Image
              src="/Logo-bcc.webp"
              alt="Bharath Academy"
              width={200}
              height={60}
              className="object-contain"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold">Student Login</CardTitle>
          <CardDescription>Enter your roll number and password to access your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="rollNo">Student Roll No</Label>
              <Input
                id="rollNo"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="username"
                placeholder="ROLL001"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full bg-[#1E2A4A] hover:bg-[#0D7C8F]" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Signing In...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center gap-1">
          <p className="text-xs text-muted-foreground text-center">
            Forgot your password? Please contact your branch office.
          </p>
          <Button variant="link" size="sm" asChild>
            <Link href="/login">Staff Login</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
