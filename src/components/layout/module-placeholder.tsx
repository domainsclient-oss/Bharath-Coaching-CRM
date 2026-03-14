
"use client";

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

export function ModulePlaceholder({ title, description, icon: Icon }: ModulePlaceholderProps) {
  return (
    <div className="flex h-[calc(100vh-10rem)] w-full items-center justify-center p-4">
      <Card className="max-w-md border-dashed border-2 bg-transparent">
        <CardContent className="flex flex-col items-center text-center p-12">
          <div className="rounded-full bg-accent/10 p-6 text-accent mb-6 animate-pulse">
            <Icon size={48} />
          </div>
          <Badge variant="outline" className="mb-4 text-accent border-accent/30 bg-accent/5">
            Module Under Development
          </Badge>
          <h2 className="text-2xl font-bold mb-2 text-primary">{title}</h2>
          <p className="text-muted-foreground leading-relaxed">
            {description}
          </p>
          <div className="mt-8 flex gap-2">
            <div className="h-1.5 w-8 rounded-full bg-accent" />
            <div className="h-1.5 w-4 rounded-full bg-accent/30" />
            <div className="h-1.5 w-4 rounded-full bg-accent/30" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
