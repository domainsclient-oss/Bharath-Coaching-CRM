
"use client";

import { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePathname } from 'next/navigation';

interface ModulePlaceholderProps {
  title: string;
  description: string;
  icon: LucideIcon;
  comingSoon?: boolean;
}

export function ModulePlaceholder({ 
  title, 
  description, 
  icon: Icon, 
  comingSoon = true 
}: ModulePlaceholderProps) {
  const pathname = usePathname();
  const breadcrumb = pathname.split('/').filter(Boolean).map(p => p.charAt(0).toUpperCase() + p.slice(1)).join(' > ');

  return (
    <div className="flex flex-col min-h-[calc(100vh-4rem)] p-4 md:p-8">
      <div className="text-xs font-semibold text-muted-foreground mb-8 uppercase tracking-wider">
        Dashboard {breadcrumb.includes(' > ') ? `> ${breadcrumb.split(' > ').slice(1).join(' > ')}` : ''}
      </div>

      <div className="flex flex-1 items-center justify-center">
        <Card className="max-w-md border-dashed border-2 bg-transparent">
          <CardContent className="flex flex-col items-center text-center p-12">
            <div className="rounded-full bg-accent/10 p-6 text-accent mb-6">
              <Icon size={48} />
            </div>
            {comingSoon && (
              <Badge variant="outline" className="mb-4 text-amber-600 border-amber-600/30 bg-amber-50">
                Module Coming Soon
              </Badge>
            )}
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
    </div>
  );
}
