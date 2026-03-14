
"use client";

import { useState } from 'react';
import { GraduationCap, Lock, Mail, User as UserIcon, Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { toast } from '@/hooks/use-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({ id: '', password: '' });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [id === 'staff-email' || id === 'student-roll' ? 'id' : 'password']: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent, type: 'staff' | 'student') => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(credentials, type);
      if (success) {
        toast({
          title: "Login Successful",
          description: "Welcome back to Bharath Academy!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: "Invalid credentials. Please check your details and try again.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again later.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#1E2A4A] to-[#0D7C8F] p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center">
          <div className="rounded-2xl bg-white p-3 text-[#1E2A4A] shadow-xl transition-all-150 hover:scale-105">
            <GraduationCap size={40} />
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">Bharath Academy</h2>
          <p className="mt-2 text-sm text-white/70">Management Portal · Trichy Branch</p>
        </div>

        <Tabs defaultValue="staff" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10 p-1 text-white">
            <TabsTrigger value="staff" className="data-[state=active]:bg-[#1E2A4A] data-[state=active]:text-white">Staff / Admin</TabsTrigger>
            <TabsTrigger value="student" className="data-[state=active]:bg-[#1E2A4A] data-[state=active]:text-white">Student</TabsTrigger>
          </TabsList>
          
          <TabsContent value="staff">
            <Card className="border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-[#1E2A4A]">Staff Login</CardTitle>
                <CardDescription>Enter your official email to access the portal.</CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleSubmit(e, 'staff')}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="staff-email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="staff-email" 
                        placeholder="admin@center.com" 
                        className="pl-10" 
                        required 
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="staff-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="staff-password" 
                        type={showPassword ? "text" : "password"} 
                        className="pl-10 pr-10" 
                        required 
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-[#1E2A4A] hover:bg-[#0D7C8F] transition-all-150" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In as Staff'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>

          <TabsContent value="student">
            <Card className="border-none shadow-2xl">
              <CardHeader>
                <CardTitle className="text-xl text-[#1E2A4A]">Student Login</CardTitle>
                <CardDescription>Access your dashboard using your roll number.</CardDescription>
              </CardHeader>
              <form onSubmit={(e) => handleSubmit(e, 'student')}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="student-roll">Roll Number</Label>
                    <div className="relative">
                      <UserIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="student-roll" 
                        placeholder="e.g. ROLL001" 
                        className="pl-10" 
                        required 
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="student-password">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input 
                        id="student-roll-password" 
                        type={showPassword ? "text" : "password"} 
                        className="pl-10 pr-10" 
                        required 
                        onChange={handleInputChange}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-3 text-muted-foreground hover:text-primary"
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button type="submit" className="w-full bg-[#0D7C8F] hover:bg-[#1E2A4A] transition-all-150" disabled={isLoading}>
                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign In as Student'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
        </Tabs>

        <p className="text-center text-xs text-white/50">
          © 2025 Bharath Academy. All rights reserved.
        </p>
      </div>
    </div>
  );
}
