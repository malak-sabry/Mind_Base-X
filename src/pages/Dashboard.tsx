import { useHR } from "@/contexts/HRContext";
import { Users, ListTodo, CheckCircle, AlertTriangle, Clock, TrendingUp, CalendarDays } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS } from "@/types/hr";

export default function Dashboard() {
  const { stats, employees, tasks, leaveRequests, hasExcessiveAbsence, getAbsentDays, getEmployeeById } = useHR();
  const navigate = useNavigate();
  const [showCompletion, setShowCompletion] = useState(false);
  const [showAbsence, setShowAbsence] = useState(false);

  const completedTasks = tasks.filter((t) => t.status === "done");
  const absentEmployees = employees.filter((e) => hasExcessiveAbsence(e));
  const recentTasks = [...tasks].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const statCards = [
    { label: "إجمالي الموظفين", value: stats.totalEmployees, icon: Users, color: "text-primary", onClick: () => navigate("/employees") },
    { label: "إجمالي المهام", value: stats.totalTasks, icon: ListTodo, color: "text-info", onClick: () => navigate("/tasks") },
    { label: "مهام مكتملة", value: stats.completedTasks, icon: CheckCircle, color: "text-success", onClick: () => setShowCompletion(true) },
    { label: "مهام متأخرة", value: stats.lateTasks, icon: Clock, color: "text-destructive", onClick: () => navigate("/tasks") },
    { label: "نسبة الإنجاز", value: `${stats.completionRate}%`, icon: TrendingUp, color: "text-accent", onClick: () => setShowCompletion(true) },
    { label: "تنبيهات غياب", value: stats.absenceAlerts, icon: AlertTriangle, color: "text-warning", onClick: () => setShowAbsence(true) },
    { label: "طلبات إجازة معلقة", value: stats.pendingLeaves, icon: CalendarDays, color: "text-info", onClick: () => navigate("/leave-requests") },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">لوحة التحكم</h1>
        <p className="text-muted-foreground text-sm mt-1">مرحباً بك في Mind_Base X - نظرة عامة على الأداء</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {statCards.map((card) => (
          <button key={card.label} onClick={card.onClick} className="stat-card text-right cursor-pointer">
            <card.icon className={`${card.color} mb-2`} size={22} />
            <p className="text-2xl font-bold font-cairo text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground font-cairo mt-1">{card.label}</p>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-bold font-cairo mb-4 text-foreground">آخر المهام</h2>
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const emp = getEmployeeById(task.assignedTo);
              return (
                <div key={task.id} onClick={() => navigate("/tasks")} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors">
                  <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold shrink-0">{emp?.fullName.charAt(0) || "؟"}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate font-cairo">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{emp?.fullName || "غير معين"}</p>
                  </div>
                  <span className={task.status === "done" ? "badge-success" : task.status === "late" ? "badge-destructive" : "badge-info"}>
                    {task.status === "done" ? "مكتمل" : task.status === "late" ? "متأخر" : "قيد التنفيذ"}
                  </span>
                </div>
              );
            })}
            {recentTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مهام</p>}
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-bold font-cairo mb-4 text-foreground">تنبيهات الغياب</h2>
          <div className="space-y-3">
            {absentEmployees.map((emp) => (
              <div key={emp.id} onClick={() => navigate(`/employees/${emp.id}`)} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors border border-warning/20 bg-warning/5">
                <AlertTriangle className="text-warning shrink-0" size={18} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground font-cairo">{emp.fullName}</p>
                  <p className="text-xs text-muted-foreground">غاب {getAbsentDays(emp)} يوم</p>
                </div>
                <span className="badge-warning">تحذير</span>
              </div>
            ))}
            {absentEmployees.length === 0 && (
              <div className="text-center py-6">
                <CheckCircle className="text-success mx-auto mb-2" size={28} />
                <p className="text-sm text-muted-foreground">لا توجد تنبيهات غياب</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={showCompletion} onOpenChange={setShowCompletion}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-cairo">تفاصيل الإنجاز ({stats.completionRate}%)</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div className="w-full bg-muted rounded-full h-3"><div className="gradient-primary h-3 rounded-full transition-all" style={{ width: `${stats.completionRate}%` }} /></div>
            <p className="text-sm text-muted-foreground">{stats.completedTasks} من {stats.totalTasks} مهمة مكتملة</p>
            <div className="space-y-2 mt-4">
              {completedTasks.map((t) => {
                const emp = getEmployeeById(t.assignedTo);
                return (
                  <div key={t.id} className="p-3 rounded-lg bg-muted/50">
                    <p className="text-sm font-medium font-cairo">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-1">أنجزها: {emp?.fullName} — {t.completedAt ? new Date(t.completedAt).toLocaleDateString("ar-EG") : ""}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAbsence} onOpenChange={setShowAbsence}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-cairo">تنبيهات الغياب المفرط</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            {absentEmployees.map((emp) => (
              <div key={emp.id} className="p-3 rounded-lg border border-warning/20 bg-warning/5">
                <p className="text-sm font-medium font-cairo">{emp.fullName}</p>
                <p className="text-xs text-muted-foreground">{DEPARTMENTS.find((d) => d.value === emp.department)?.label} — غاب {getAbsentDays(emp)} يوم</p>
              </div>
            ))}
            {absentEmployees.length === 0 && <p className="text-sm text-muted-foreground text-center">لا يوجد موظفين بغياب مفرط</p>}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
