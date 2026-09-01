"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronRight, Users, TrendingUp, ArrowRight } from "lucide-react";
import { SharedHeader } from "@/components/layout/shared-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockLeads, LeadSource, SOURCE_COLORS } from "@/data/leadsData";
import { useBranch } from "@/context/BranchContext";

// slug <-> source mapping (single source of truth)
export const SOURCE_SLUGS: Record<string, LeadSource> = {
  "walk-in": "Walk-in",
  "phone-call": "Phone Call",
  "whatsapp": "WhatsApp Enquiry",
  "social-media": "Social Media",
  "student-referral": "Student Referral",
  "school-reference": "School Reference",
  "banner-sunpack": "Banner / Sunpack",
  "pamphlet": "Pamphlet",
  "google-seo": "Google (SEO)",
  "website": "Website",
  "old-students": "Old Students",
};

const SOURCE_ICONS: Record<string, string> = {
  "Walk-in": "🚶",
  "Phone Call": "📞",
  "WhatsApp Enquiry": "💬",
  "Social Media": "📱",
  "Student Referral": "👥",
  "School Reference": "🏫",
  "Banner / Sunpack": "🪧",
  "Pamphlet": "📄",
  "Google (SEO)": "🔍",
  "Website": "🌐",
  "Old Students": "🎓",
};

export default function LeadSourcesOverviewPage() {
  const { currentBranch } = useBranch();

  const leads = useMemo(() =>
    mockLeads.filter(l => l.branchId === currentBranch),
    [currentBranch]
  );

  const sourceStats = useMemo(() => {
    return Object.entries(SOURCE_SLUGS).map(([slug, source]) => {
      const sourceLeads = leads.filter(l => l.source === source);
      const admitted = sourceLeads.filter(l => l.status === "Admitted").length;
      const active = sourceLeads.filter(l => !["Admitted", "Not Interested"].includes(l.status)).length;
      return {
        slug, source,
        total: sourceLeads.length,
        admitted,
        active,
        conversionRate: sourceLeads.length
          ? Math.round((admitted / sourceLeads.length) * 100)
          : 0,
      };
    }).sort((a, b) => b.total - a.total);
  }, [leads]);

  const totalLeads = leads.length;
  const totalAdmitted = leads.filter(l => l.status === "Admitted").length;
  const topSource = sourceStats[0];

  return (
    <div className="flex flex-col min-h-screen bg-[#F5F7FA]">
      <SharedHeader title="Lead Sources" />

      <main className="p-4 md:p-6 lg:p-8 space-y-6 animate-in fade-in duration-500">
        {/* Breadcrumb */}
        <div className="flex items-center text-xs text-muted-foreground gap-2">
          <Link href="/admin" className="hover:text-[#0D7C8F]">Dashboard</Link>
          <ChevronRight className="h-3 w-3" />
          <Link href="/admin/leads" className="hover:text-[#0D7C8F]">Leads</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="font-medium text-foreground">Lead Sources</span>
        </div>

        <h2 className="text-2xl font-bold text-[#1E2A4A]">Lead Sources Overview</h2>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Enquiries</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{totalLeads}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Admitted</p>
                <p className="text-2xl font-bold text-[#1E2A4A]">{totalAdmitted}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-none shadow-sm bg-gradient-to-br from-[#1E2A4A] to-[#0D7C8F] text-white">
            <CardContent className="p-4">
              <p className="text-xs text-white/60 font-bold uppercase">Top Source</p>
              {topSource && (
                <>
                  <p className="text-lg font-bold mt-1">
                    {SOURCE_ICONS[topSource.source]} {topSource.source}
                  </p>
                  <p className="text-xs text-white/60">{topSource.total} enquiries · {topSource.conversionRate}% conversion</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Source Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {sourceStats.map(({ slug, source, total, admitted, active, conversionRate }) => (
            <Link key={slug} href={`/admin/leads/sources/${slug}`}>
              <Card className="border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group h-full">
                <CardContent className="p-5 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{SOURCE_ICONS[source]}</span>
                    <Badge className={`text-xs ${SOURCE_COLORS[source]}`}>{total} leads</Badge>
                  </div>
                  <div>
                    <p className="font-bold text-[#1E2A4A] text-sm leading-tight">{source}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span className="text-green-600 font-semibold">{admitted} admitted</span>
                      <span>·</span>
                      <span className="text-blue-600 font-semibold">{active} active</span>
                    </div>
                  </div>
                  {/* Conversion bar */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Conversion</span>
                      <span className="font-bold text-[#0D7C8F]">{conversionRate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#0D7C8F] transition-all"
                        style={{ width: `${conversionRate}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-[#0D7C8F] font-semibold group-hover:gap-2 transition-all">
                    View Details <ArrowRight className="h-3 w-3" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
