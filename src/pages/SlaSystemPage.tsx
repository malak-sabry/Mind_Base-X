import { useMemo } from "react";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Clock, ShieldCheck, TrendingDown } from "lucide-react";

export default function SlaSystemPage() {
  const { tasks: allTasks, employees: allEmployees, getEmployeeById } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  // Non-managers see ONLY their own data
  const tasks = useMemo(
    () => isManager ? allTasks : allTasks.filter(t => t.assignedTo === user?.employeeId),
    [allTasks, isManager, user?.employeeId]
  );
  const employees = useMemo(
    () => isManager ? allEmployees : allEmployees.filter(e => e.id === user?.employeeId),
    [allEmployees, isManager, user?.employeeId]
  );

  const stats = useMemo(() => {
    const completed = tasks.filter((t) => t.status === "done" && t.completedAt);
    const breached = tasks.filter((t) => {
      if (t.status === "late") return true;
      if (t.status === "done" && t.completedAt) return new Date(t.completedAt) > new Date(t.deadline);
      return false;
    });
    const onTime = completed.filter((t) => new Date(t.completedAt!) <= new Date(t.deadline));
    const score = completed.length ? Math.round((onTime.length / completed.length) * 100) : 100;

    const avgDurationMs = completed.length
      ? completed.reduce((s, t) => s + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()), 0) / completed.length
      : 0;
    const avgHours = Math.round(avgDurationMs / (1000 * 60 * 60));

    return { total: tasks.length, completed: completed.length, breached: breached.length, onTime: onTime.length, score, avgHours };
  }, [tasks]);

  const perEmployee = useMemo(() => {
    return employees.map((emp) => {
      const empTasks = tasks.filter((t) => t.assignedTo === emp.id);
      const done = empTasks.filter((t) => t.status === "done" && t.completedAt);
      const onTime = done.filter((t) => new Date(t.completedAt!) <= new Date(t.deadline));
      const breaches = empTasks.filter((t) => {
        if (t.status === "late") return true;
        if (t.status === "done" && t.completedAt) return new Date(t.completedAt) > new Date(t.deadline);
        return false;
      }).length;
      const score = done.length ? Math.round((onTime.length / done.length) * 100) : 100;
      const avgMs = done.length
        ? done.reduce((s, t) => s + (new Date(t.completedAt!).getTime() - new Date(t.createdAt).getTime()), 0) / done.length
        : 0;
      const avgH = Math.round(avgMs / (1000 * 60 * 60));
      return { emp, total: empTasks.length, done: done.length, breaches, score, avgH };
    }).filter((r) => r.total > 0).sort((a, b) => b.score - a.score);
  }, [tasks, employees]);

  const breaches = useMemo(() => tasks.filter((t) => {
    if (t.status === "late") return true;
    if (t.status === "done" && t.completedAt) return new Date(t.completedAt) > new Date(t.deadline);
    return false;
  }).slice(0, 10), [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">SLA System — اتفاقية مستوى الخدمة</h1>
        <p className="text-muted-foreground text-sm mt-1 font-cairo">
          {isManager
            ? "مراقبة التزام كل موظف بالمواعيد المتفق عليها وتأثير التأخير على جودة الأداء."
            : "بياناتك الشخصية فقط — مدى التزامك بالمواعيد على مهامك أنت."}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-emerald-600"><ShieldCheck size={18} /><span className="text-xs font-cairo">معدل الالتزام</span></div>
          <div className="text-3xl font-bold mt-2">{stats.score}%</div>
          <Progress value={stats.score} className="mt-2 h-1.5" />
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-blue-600"><CheckCircle2 size={18} /><span className="text-xs font-cairo">مهام في الوقت</span></div>
          <div className="text-3xl font-bold mt-2">{stats.onTime}</div>
          <p className="text-[11px] text-muted-foreground mt-1 font-cairo">من {stats.completed} مكتملة</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-rose-600"><AlertTriangle size={18} /><span className="text-xs font-cairo">انتهاكات SLA</span></div>
          <div className="text-3xl font-bold mt-2">{stats.breached}</div>
          <p className="text-[11px] text-muted-foreground mt-1 font-cairo">تأخير أو فوات موعد</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-amber-600"><Clock size={18} /><span className="text-xs font-cairo">متوسط زمن الإنجاز</span></div>
          <div className="text-3xl font-bold mt-2">{stats.avgHours}<span className="text-sm font-normal mr-1">ساعة</span></div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-bold font-cairo mb-4">{isManager ? "أداء SLA لكل موظف" : "أداء SLA الخاص بك"}</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-right text-xs text-muted-foreground border-b border-border">
                <th className="py-2 px-2 font-cairo">الموظف</th>
                <th className="py-2 px-2 font-cairo">إجمالي المهام</th>
                <th className="py-2 px-2 font-cairo">مكتملة</th>
                <th className="py-2 px-2 font-cairo">انتهاكات</th>
                <th className="py-2 px-2 font-cairo">متوسط الإنجاز</th>
                <th className="py-2 px-2 font-cairo">نسبة الالتزام</th>
              </tr>
            </thead>
            <tbody>
              {perEmployee.map((r) => (
                <tr key={r.emp.id} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="py-3 px-2 font-cairo font-medium">{r.emp.fullName}</td>
                  <td className="py-3 px-2">{r.total}</td>
                  <td className="py-3 px-2">{r.done}</td>
                  <td className="py-3 px-2">
                    {r.breaches > 0
                      ? <Badge variant="outline" className="bg-rose-500/15 text-rose-700 border-rose-500/30">{r.breaches}</Badge>
                      : <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">0</Badge>}
                  </td>
                  <td className="py-3 px-2 font-cairo">{r.avgH} ساعة</td>
                  <td className="py-3 px-2">
                    <div className="flex items-center gap-2">
                      <Progress value={r.score} className="h-1.5 w-24" />
                      <span className={`text-xs font-semibold ${r.score >= 80 ? "text-emerald-600" : r.score >= 50 ? "text-amber-600" : "text-rose-600"}`}>{r.score}%</span>
                    </div>
                  </td>
                </tr>
              ))}
              {perEmployee.length === 0 && (
                <tr><td colSpan={6} className="py-8 text-center text-muted-foreground font-cairo">لا توجد بيانات بعد</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingDown className="text-rose-600" size={20} />
          <h2 className="text-lg font-bold font-cairo">آخر انتهاكات SLA</h2>
        </div>
        {breaches.length === 0 ? (
          <p className="text-sm text-muted-foreground font-cairo text-center py-6">لا توجد انتهاكات حالياً — أداء ممتاز.</p>
        ) : (
          <div className="space-y-2">
            {breaches.map((t) => {
              const emp = getEmployeeById(t.assignedTo);
              const due = new Date(t.deadline);
              const done = t.completedAt ? new Date(t.completedAt) : null;
              const overdueHours = done
                ? Math.round((done.getTime() - due.getTime()) / (1000 * 60 * 60))
                : Math.round((Date.now() - due.getTime()) / (1000 * 60 * 60));
              return (
                <div key={t.id} className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/20">
                  <div>
                    <p className="font-cairo font-semibold text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground font-cairo">{emp?.fullName || "—"} • موعد: {due.toLocaleDateString("ar-EG")}</p>
                  </div>
                  <Badge variant="outline" className="bg-rose-500/15 text-rose-700 border-rose-500/30 font-cairo">
                    تأخر {overdueHours} ساعة
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
