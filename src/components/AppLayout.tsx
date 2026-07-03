import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, ListTodo, Menu, X, CalendarCheck, Wallet, LogOut, CalendarDays, FileText, Briefcase, Building2, Activity, Target, Contact2, Award, KanbanSquare, Factory, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

const managerNav = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard },
  { to: "/employees", label: "الموظفين", icon: Users },
  { to: "/tasks", label: "المهام", icon: ListTodo },
  { to: "/attendance", label: "الحضور والانصراف", icon: CalendarCheck },
  { to: "/payroll", label: "المرتبات", icon: Wallet },
  { to: "/leave-requests", label: "طلبات الإجازات", icon: CalendarDays },
  { to: "/reports", label: "التقارير", icon: FileText },
];

const crmNav = [
  { to: "/crm", label: "لوحة CRM", icon: Target },
  { to: "/crm/accounts", label: "الشركات", icon: Building2 },
  { to: "/crm/contacts", label: "جهات الاتصال", icon: Contact2 },
  { to: "/crm/deals", label: "الصفقات", icon: Briefcase },
  { to: "/crm/pipeline", label: "Pipeline", icon: LayoutDashboard },
  { to: "/crm/activities", label: "الأنشطة", icon: Activity },
];

const systemsNav = [
  { to: "/micromanage", label: "Micromanage", icon: KanbanSquare },
  { to: "/erp", label: "ERP System", icon: Factory },
  { to: "/sla", label: "SLA System", icon: ShieldCheck },
];

const employeeBaseNav = [
  { to: "/", label: "ملفي الشخصي", icon: LayoutDashboard },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, logout } = useAuth();
  const isManager = user?.role === "manager";

  const mainNav = isManager ? managerNav : employeeBaseNav;
  const performanceLink = { to: "/crm/performance", label: "أداء الفريق", icon: Award };

  return (
    <div className="flex min-h-screen w-full" dir="rtl">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-foreground/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <aside className={cn(
        "fixed lg:sticky top-0 right-0 z-50 h-screen w-64 sidebar-gradient flex flex-col transition-transform duration-300 lg:translate-x-0",
        sidebarOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
      )}>
        <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">X</div>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-sidebar-primary-foreground font-cairo">Mind_Base X</h1>
            <p className="text-xs text-sidebar-foreground/60">إدارة ذكية</p>
          </div>
          <button className="lg:hidden text-sidebar-foreground" onClick={() => setSidebarOpen(false)}><X size={20} /></button>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {mainNav.map((item) => {
            const isActive = location.pathname === item.to || (item.to !== "/" && location.pathname.startsWith(item.to));
            return (
              <RouterNavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <item.icon size={20} />
                <span className="font-cairo">{item.label}</span>
              </RouterNavLink>
            );
          })}

          <div className="px-4 pt-5 pb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-cairo">
            {isManager ? "متابعة العملاء (عرض فقط)" : "إدارة العملاء (CRM)"}
          </div>

          {isManager && (
            <RouterNavLink
              to={performanceLink.to}
              onClick={() => setSidebarOpen(false)}
              className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                location.pathname === performanceLink.to
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}
            >
              <performanceLink.icon size={20} />
              <span className="font-cairo">{performanceLink.label}</span>
            </RouterNavLink>
          )}

          {crmNav.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <RouterNavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <item.icon size={20} />
                <span className="font-cairo">{item.label}</span>
              </RouterNavLink>
            );
          })}

          <div className="px-4 pt-5 pb-2 text-[10px] uppercase tracking-wider text-sidebar-foreground/40 font-cairo">
            الأنظمة المتقدمة
          </div>

          {systemsNav.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <RouterNavLink key={item.to} to={item.to} onClick={() => setSidebarOpen(false)}
                className={cn("flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
                <item.icon size={20} />
                <span className="font-cairo">{item.label}</span>
              </RouterNavLink>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-sidebar-border space-y-3">
          <div className="flex items-center gap-2 px-3">
            <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{user?.name?.charAt(0) || "م"}</div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-foreground truncate font-cairo">{user?.name}</p>
              <p className="text-[10px] text-sidebar-foreground/50">{isManager ? "مدير" : (user?.department || "موظف")}</p>
            </div>
          </div>
          <RouterNavLink to="/settings" onClick={() => setSidebarOpen(false)}
            className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors font-cairo">
            ⚙️ الإعدادات
          </RouterNavLink>
          <button onClick={logout} className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent transition-colors font-cairo">
            <LogOut size={16} /> تسجيل الخروج
          </button>
          <p className="text-xs text-sidebar-foreground/40 text-center font-cairo">MBX — Mind_Base X</p>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-h-screen">
        <header className="sticky top-0 z-30 bg-card/80 backdrop-blur-md border-b border-border px-4 lg:px-6 py-3 flex items-center gap-4">
          <button className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="flex-1" />
          <NotificationsDropdown />
          <span className="text-sm font-cairo text-muted-foreground">{user?.name}</span>
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold">{user?.name?.charAt(0) || "م"}</div>
        </header>
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
