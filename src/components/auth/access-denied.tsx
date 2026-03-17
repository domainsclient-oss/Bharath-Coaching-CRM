
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock } from "lucide-react";
import Link from "next/link";

export const AccessDenied = () => {
  return (
    <Card className="max-w-md mx-auto mt-10">
      <CardHeader className="text-center">
        <div className="mx-auto bg-red-100 rounded-full p-3 w-16 h-16 flex items-center justify-center">
            <Lock className="h-8 w-8 text-red-600" />
        </div>
        <CardTitle className="pt-4">Access Restricted</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <p className="text-muted-foreground mb-6">
          This page is only accessible to Super Admins. Please contact support if you believe this is an error.
        </p>
        <Button asChild>
          <Link href="/dashboard">Go to Dashboard</Link>
        </Button>
      </CardContent>
    </Card>
  );
};
