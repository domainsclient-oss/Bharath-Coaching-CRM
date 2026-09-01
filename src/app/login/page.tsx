'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { releaseUiLock } from '../../lib/release-ui-lock';
import { resetPassword } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import { useSettings } from '../../context/SettingsContext';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();

  // Any body lock still set once this page mounts was leaked by a modal layer
  // on the page we came from (e.g. the logout confirm dialog) and would leave
  // these inputs unfocusable. Clear it so the form is usable without a refresh.
  useEffect(() => {
    releaseUiLock();
  }, []);

  const getAuthErrorMessage = (errorCode: string) => {
    switch (errorCode) {
      case 'auth/user-not-found':
      case 'auth/wrong-password':
      case 'auth/invalid-credential':
        return 'Invalid email or password. Please try again.';
      case 'auth/too-many-requests':
        return 'Too many login attempts. Please reset your password or try again later.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({
        title: 'Missing Information',
        description: 'Please enter both email and password.',
        variant: 'destructive',
      });
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password);
      toast({
        title: 'Login Successful',
        description: `Welcome back to ${settings.appName}! Redirecting...`,
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      toast({
        title: 'Login Failed',
        description: getAuthErrorMessage(error.code),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast({
        title: 'Email Required',
        description: 'Please enter your email address to reset your password.',
        variant: 'destructive',
      });
      return;
    }
    try {
      await resetPassword(email);
      toast({
        title: 'Password Reset Email Sent',
        description: 'If an account exists for that email, a reset link has been sent to your inbox.',
      });
    } catch (error: any) {
      console.error('Password reset failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to send password reset email. Please try again.',
        variant: 'destructive',
      });
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
          <CardTitle className="text-2xl font-bold">Welcome to {settings.appName}</CardTitle>
          <CardDescription>Enter your credentials to access your portal</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@bharathacademy.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              {isLoading ? 'Signing In...' : 'Sign In'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button variant="link" size="sm" onClick={handleForgotPassword} disabled={isLoading}>
            Forgot Password?
          </Button>
        </CardFooter>
      </Card>

    </div>
  );
}