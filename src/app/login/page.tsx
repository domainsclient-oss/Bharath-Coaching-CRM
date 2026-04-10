'use client';

import { useState } from 'react';
import { useAuth } from '../../lib/auth-context';
import { resetPassword } from '../../services/authService';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';
import centerConfig from '../../config/centerConfig';
import { Loader2, AlertCircle, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

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
        description: `Welcome back to ${centerConfig.centerName}! Redirecting...`,
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
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16">
            <img src={centerConfig.logo} alt={`${centerConfig.centerName} Logo`} className="h-full w-full object-contain" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to {centerConfig.centerName}</CardTitle>
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
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
              />
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

      {/* Developer Helper Box */}
      <Card className="w-full max-w-md border-amber-200 bg-amber-50">
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600 shrink-0" />
            <div className="space-y-2">
              <p className="text-sm font-bold text-amber-800">Developer Access</p>
              <p className="text-xs text-amber-700">
                1. Navigate to <Link href="/setup" className="font-bold underline">/setup</Link> to initialize your database first.<br />
                2. Use the following credentials for testing:
              </p>
              <div className="bg-white/50 p-2 rounded border border-amber-200 text-[10px] font-mono text-amber-900">
                Email: admin@bharathacademy.com<br />
                Pass: password123
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}