"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, CalendarClock, CheckCheck, IndianRupee, Loader2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNotifications, type AppNotification } from "@/hooks/use-notifications";
import { releaseUiLock } from "@/lib/release-ui-lock";
import { cn } from "@/lib/utils";

const KIND_ICON = {
  followup: CalendarClock,
  fee: IndianRupee,
  lead: UserPlus,
} as const;

const SEVERITY_STYLES = {
  urgent: { accent: "border-l-red-500", icon: "bg-red-100 text-red-600" },
  warning: { accent: "border-l-amber-500", icon: "bg-amber-100 text-amber-600" },
  info: { accent: "border-l-[#0D7C8F]", icon: "bg-[#0D7C8F]/10 text-[#0D7C8F]" },
} as const;

export function NotificationsPopover() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();

  const handleOpen = (notification: AppNotification) => {
    markAsRead(notification.id);
    setOpen(false);
    // The popover unmounts in the same tick as the push; clear any lock it left
    // behind so the destination page stays interactive (see tasks/lessons.md).
    releaseUiLock();
    router.push(notification.href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative transition-all-150"
          aria-label={
            unreadCount > 0 ? `Notifications, ${unreadCount} unread` : "Notifications"
          }
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[22rem] p-0 sm:w-96">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-[#1E2A4A]">Notifications</p>
            <p className="text-xs text-muted-foreground">
              {unreadCount > 0 ? `${unreadCount} unread` : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1 px-2 text-xs text-[#0D7C8F] hover:text-[#0D7C8F]"
              onClick={markAllAsRead}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </Button>
          )}
        </div>

        {loading && notifications.length === 0 ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300" />
            <p className="text-sm font-medium text-[#1E2A4A]">Nothing needs attention</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Overdue follow-ups, fee dues and new enquiries appear here.
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-96">
            <ul className="divide-y">
              {notifications.map((n) => {
                const Icon = KIND_ICON[n.kind];
                const styles = SEVERITY_STYLES[n.severity];
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => handleOpen(n)}
                      className={cn(
                        "flex w-full items-start gap-3 border-l-4 px-4 py-3 text-left transition-colors hover:bg-muted/60",
                        styles.accent,
                        n.read && "opacity-60"
                      )}
                    >
                      <span
                        className={cn(
                          "mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full",
                          styles.icon
                        )}
                      >
                        <Icon className="h-3.5 w-3.5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium text-[#1E2A4A]">
                            {n.title}
                          </span>
                          {!n.read && (
                            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-red-500" />
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {n.description}
                        </span>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </ScrollArea>
        )}

        <div className="border-t px-4 py-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-full text-xs text-[#0D7C8F] hover:text-[#0D7C8F]"
            onClick={() => {
              setOpen(false);
              releaseUiLock();
              router.push("/admin/leads/reminders");
            }}
          >
            View all reminders
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
