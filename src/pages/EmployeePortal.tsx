import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHR } from "@/contexts/HRContext";
import { Phone, Mail, MapPin, Calendar, Briefcase, AlertTriangle, CheckCircle, Clock, Wallet, CalendarDays, Send } from "lucide-react";
import { DEPARTMENTS, LEAVE_TYPES } from "@/types/hr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function EmployeePortal() {
  const { user } = useAuth();
  const { getEmployeeById, getTasksForEmployee, getAbsentDays, getPresentDays, hasExcessiveAbsence, addLeaveRequest, getLeaveRequestsForEmployee } = useHR();
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveForm, setLeaveForm] = useState({ leaveType: "annual", startDate: "", endDate: "", reason: "" });

  const emp = getEmployeeById(user?.employeeId || "");
  if (!emp) return <div className="text-center py-20 text-muted-foreground font-cairo">لم يتم العثور على بياناتك</div>;

  const empTasks = getTasksForEmployee(emp.id);
  const empLeaves = getLeaveRequestsForEmployee(emp.id);
  const absent = getAbsentDays(emp);
  const present = getPresentDays(emp);
  const isExcessive = hasExcessiveAbsence(emp);
  const attendanceRate = present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0;
  const dailyRate = emp.salary / 30;
  const netSalary = Math.max(0, emp.salary - absent * dailyRate);

  const doneTasks = empTasks.filter(t => t.status === "done").length;
  const pendingTasks = empTasks.filter(t => t.status === "pending").length;
  const lateTasks = empTasks.filter(t => t.status === "late").length;

  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addLeaveRequest({
      employeeId: emp.id,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate,
      endDate: leaveForm.endDate,
      reason: leaveForm.reason,
    });
    setShowLeaveForm(false);
    setLeaveForm({ leaveType: "annual", startDate: "", endDate: "", reason: "" });
  };

  const statusLabel = (s: string) => s === "pending" ? "قيد المراجعة" : s === "approved" ? "تمت الموافقة" : "مرفوض";
  const statusBadge = (s: string) => s === "pending" ? "badge-warning" : s === "approved" ? "badge-success" : "badge-destructive";

  const infoItems = [
    { icon: Phone, label: "التليفون", value: emp.phone },
    { icon: Mail, label: "الإيميل", value: emp.email },
    { icon: MapPin, label: "العنوان", value: emp.address || "غير محدد" },
    { icon: Calendar, label: "تاريخ الانضمام", value: new Date(emp.joinDate).toLocaleDateString("ar-EG") },
    { icon: Briefcase, label: "القسم", value: DEPARTMENTS.find(d => d.value === emp.department)?.label || emp.department },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-cairo text-foreground">مرحباً، {emp.fullName} 👋</h1>
        <Button onClick={() => setShowLeaveForm(true)} className="gradient-primary text-primary-foreground gap-2 font-cairo">
          <CalendarDays size={16} /> طلب إجازة
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <SummaryCard label="أيام الحضور" value={present} color="text-success" bg="bg-success/10" />
        <SummaryCard label="أيام الغياب" value={absent} color={isExcessive ? "text-destructive" : "text-warning"} bg={isExcessive ? "bg-destructive/10" : "bg-warning/10"} />
        <SummaryCard label="المهام المكتملة" value={doneTasks} color="text-success" bg="bg-success/10" />
        <SummaryCard label="المهام المعلقة" value={pendingTasks + lateTasks} color="text-primary" bg="bg-primary/10" />
      </div>

      {isExcessive && (
        <div className="flex items-center gap-3 p-4 rounded-xl border border-warning/30 bg-warning/5">
          <AlertTriangle className="text-warning shrink-0" size={20} />
          <p className="text-sm text-warning font-cairo font-medium">تحذير: لقد تجاوزت الحد المسموح للغياب.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Info */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-xl shrink-0">{emp.fullName.charAt(0)}</div>
            <div>
              <h2 className="font-bold font-cairo text-foreground">{emp.fullName}</h2>
              <p className="text-xs text-muted-foreground">{emp.role}</p>
            </div>
          </div>
          {infoItems.map(item => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="text-muted-foreground shrink-0" size={16} />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">المهارات</p>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {emp.skills.map(s => (<span key={s} className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">{s}</span>))}
            </div>
          </div>
        </div>

        {/* Attendance + Salary */}
        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <h2 className="font-bold font-cairo text-foreground mb-4">الحضور والغياب</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-success/10 rounded-lg p-3 text-center"><p className="text-2xl font-bold text-success">{present}</p><p className="text-xs text-muted-foreground font-cairo">حضور</p></div>
              <div className={`rounded-lg p-3 text-center ${isExcessive ? "bg-destructive/10" : "bg-warning/10"}`}><p className={`text-2xl font-bold ${isExcessive ? "text-destructive" : "text-warning"}`}>{absent}</p><p className="text-xs text-muted-foreground font-cairo">غياب</p></div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">نسبة الحضور</p>
              <div className="w-full bg-muted rounded-full h-2.5"><div className="bg-success h-2.5 rounded-full transition-all" style={{ width: `${attendanceRate}%` }} /></div>
              <p className="text-xs text-muted-foreground mt-1">{attendanceRate}%</p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center gap-2 mb-3"><Wallet className="text-primary" size={18} /><h2 className="font-bold font-cairo text-foreground">الراتب الشهري</h2></div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-cairo">الراتب الأساسي</span><span className="text-foreground font-medium">{emp.salary.toLocaleString("ar-EG")} ج.م</span></div>
              {absent > 0 && (<div className="flex justify-between text-sm"><span className="text-muted-foreground font-cairo">خصم الغياب ({absent} يوم)</span><span className="text-destructive font-medium">-{Math.round(absent * dailyRate).toLocaleString("ar-EG")} ج.م</span></div>)}
              <div className="pt-2 border-t border-border flex justify-between"><span className="font-bold font-cairo text-foreground">صافي الراتب</span><span className="font-bold text-primary text-lg">{Math.round(netSalary).toLocaleString("ar-EG")} ج.م</span></div>
            </div>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold font-cairo text-foreground mb-4">المهام ({empTasks.length})</h2>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {empTasks.map(task => {
              const deadline = new Date(task.deadline);
              return (
                <div key={task.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium font-cairo text-foreground">{task.title}</p>
                    <span className={task.status === "done" ? "badge-success" : task.status === "late" ? "badge-destructive" : "badge-info"}>
                      {task.status === "done" ? "مكتمل" : task.status === "late" ? "متأخر" : "قيد التنفيذ"}
                    </span>
                  </div>
                  {task.description && <p className="text-xs text-muted-foreground mb-1">{task.description}</p>}
                  <p className="text-xs text-muted-foreground">الموعد النهائي: {deadline.toLocaleDateString("ar-EG")}</p>
                </div>
              );
            })}
            {empTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مهام حالياً</p>}
          </div>
        </div>
      </div>

      {/* Leave Requests */}
      {empLeaves.length > 0 && (
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold font-cairo text-foreground mb-4">طلبات الإجازات ({empLeaves.length})</h2>
          <div className="space-y-3">
            {empLeaves.map(req => (
              <div key={req.id} className="p-3 rounded-lg bg-muted/30 border border-border/50 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium font-cairo text-foreground">{LEAVE_TYPES.find(t => t.value === req.leaveType)?.label || req.leaveType}</p>
                  <p className="text-xs text-muted-foreground">من {new Date(req.startDate).toLocaleDateString("ar-EG")} إلى {new Date(req.endDate).toLocaleDateString("ar-EG")}</p>
                  <p className="text-xs text-muted-foreground">{req.reason}</p>
                  {req.managerNote && <p className="text-xs text-info mt-1">📝 {req.managerNote}</p>}
                </div>
                <span className={statusBadge(req.status)}>{statusLabel(req.status)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Leave Request Dialog */}
      <Dialog open={showLeaveForm} onOpenChange={setShowLeaveForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="font-cairo">طلب إجازة جديد</DialogTitle></DialogHeader>
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">نوع الإجازة</label>
              <select value={leaveForm.leaveType} onChange={(e) => setLeaveForm(p => ({ ...p, leaveType: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo">
                {LEAVE_TYPES.map(t => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm font-medium text-foreground font-cairo block mb-1.5">من</label><Input type="date" value={leaveForm.startDate} onChange={(e) => setLeaveForm(p => ({ ...p, startDate: e.target.value }))} required /></div>
              <div><label className="text-sm font-medium text-foreground font-cairo block mb-1.5">إلى</label><Input type="date" value={leaveForm.endDate} onChange={(e) => setLeaveForm(p => ({ ...p, endDate: e.target.value }))} required /></div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">السبب</label>
              <Textarea value={leaveForm.reason} onChange={(e) => setLeaveForm(p => ({ ...p, reason: e.target.value }))} required className="font-cairo" placeholder="اكتب سبب الإجازة..." />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowLeaveForm(false)} className="flex-1 font-cairo">إلغاء</Button>
              <Button type="submit" className="flex-1 gradient-primary text-primary-foreground font-cairo gap-1"><Send size={16} /> إرسال الطلب</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={`${bg} rounded-xl p-4 text-center`}>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-muted-foreground font-cairo mt-1">{label}</p>
    </div>
  );
}
