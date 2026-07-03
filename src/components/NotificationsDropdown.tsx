import { useState } from "react";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function NotificationsDropdown() {
  const { user } = useAuth();
  const { getNotificationsForRole, markNotificationRead, markAllNotificationsRead } = useHR();
  const [open, setOpen] = useState(false);

  const role = user?.role || "manager";
  const employeeId = user?.employeeId;
  const notifs = getNotificationsForRole(role, employeeId);
  const unreadCount = notifs.filter(n => !n.isRead).length;

  const typeIcon = (type: string) => {
    switch (type) {
      case "success": return "✅";
      case "warning": return "⚠️";
      case "error": return "❌";
      default: return "ℹ️";
    }
  };

  const handleMarkAllRead = () => {
    markAllNotificationsRead(role, employeeId);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-muted transition-colors">
          <Bell size={20} className="text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" dir="rtl">
        <div className="flex items-center justify-between p-3 border-b border-border">
          <h3 className="font-bold font-cairo text-sm text-foreground">الإشعارات</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="text-xs font-cairo gap-1 h-7" onClick={handleMarkAllRead}>
              <CheckCheck size={14} /> قراءة الكل
            </Button>
          )}
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8 font-cairo">لا توجد إشعارات</p>
          ) : (
            notifs.map(n => (
              <div
                key={n.id}
                className={`p-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!n.isRead ? "bg-primary/5" : ""}`}
                onClick={() => !n.isRead && markNotificationRead(n.id)}
              >
                <div className="flex items-start gap-2">
                  <span className="text-sm mt-0.5">{typeIcon(n.type)}</span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-cairo ${!n.isRead ? "font-bold text-foreground" : "text-muted-foreground"}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {new Date(n.createdAt).toLocaleDateString("ar-EG")} {new Date(n.createdAt).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  {!n.isRead && <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
