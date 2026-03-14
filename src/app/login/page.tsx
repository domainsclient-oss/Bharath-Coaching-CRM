
"use client";

import { useState } from 'react';
import { GraduationCap, Lock, Mail, User as UserIcon, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { AuthProvider, useAuth, UserRole } from '@/lib/auth-context';
import { toast } from '@/hooks/use-toast';

function LoginForm() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent, role: UserRole) => {
    e.preventDefault();
    setIsLoading(true);

    // Mock login logic
    setTimeout(() => {
      if (role === 'STUDENT') {
        login({
          id: 'S101',
          name: 'Arjun Sharma',
          rollNumber: '2023CS01',
          role: 'STUDENT',
        });
      } else {
        login({
          id: 'A1',
          name: 'Dr. Bharath Kumar',
          email: 'admin@bharathedumail.in',
          role: 'ADMIN',
        });
      }
      setIsLoading(false);
      toast({
        title: "Login Successful",
        description: `Welcome back to Bharath Edu Portal!`,
      });
    }, 1000);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-xl transition-all-150 hover:scale-105">
            <GraduationCap size={40} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-primary">Bharath Edu Portal</h2>
          <p className="mt-2 text-sm text-muted-foreground">Empowering Education with Innovation</p>
        </div>

        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="staff">Staff/Admin</TabsTrigger>
            <TabsTrigger value="student">Student</TabsTrigger>
          </TabsList>
          
          <TabsContent value="staff">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Staff Login</CardTitle>
                <CardDescription>Enter your official email to access the admin portal.</CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleLogin(e, 'ADMIN')}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="staff-email" placeholder="name@bharathedumail.in" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="staff-password" type="password" className="pl-10" required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full transition-all-150" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In as Staff'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="student">
            <Card className="border-none shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl">Student Login</CardTitle>
                <CardDescription>Access your academic dashboard using your roll number.</CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleLogin(e, 'STUDENT')}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-roll">Roll Number</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="student-roll" placeholder="e.g. 2023CS01" className="pl-10" required />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input id="student-password" type="password" className="pl-10" required />
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full transition-all-150" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In as Student'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-sm text-muted-foreground">
          Trouble signing in? <a href="#" className="font-medium text-accent hover:underline">Contact Support</a>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
