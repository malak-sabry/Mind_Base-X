import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useHR } from "@/contexts/HRContext";
import { ArrowRight, Phone, Mail, MapPin, Calendar, Briefcase, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS } from "@/types/hr";
import { AddEmployeeForm } from "@/components/AddEmployeeForm";
import { useState } from "react";

export default function EmployeeDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getEmployeeById, getTasksForEmployee, getAbsentDays, getPresentDays, hasExcessiveAbsence } = useHR();
  const [showEdit, setShowEdit] = useState(searchParams.get("edit") === "true");

  const emp = getEmployeeById(id || "");
  if (!emp) return <div className="text-center py-20 text-muted-foreground font-cairo">الموظف غير موجود</div>;

  const empTasks = getTasksForEmployee(emp.id);
  const absent = getAbsentDays(emp);
  const present = getPresentDays(emp);
  const isExcessive = hasExcessiveAbsence(emp);

  const infoItems = [
    { icon: Phone, label: "التليفون", value: emp.phone },
    { icon: Mail, label: "الإيميل", value: emp.email },
    { icon: MapPin, label: "العنوان", value: emp.address || "غير محدد" },
    { icon: Calendar, label: "تاريخ الانضمام", value: new Date(emp.joinDate).toLocaleDateString("ar-EG") },
    { icon: Briefcase, label: "القسم", value: DEPARTMENTS.find((d) => d.value === emp.department)?.label || emp.department },
  ];

  return (
    <div className="space-y-6">
      <button onClick={() => navigate("/employees")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-cairo">
        <ArrowRight size={16} /> العودة للموظفين
      </button>

      {/* Header */}
      <div className="bg-card rounded-xl border border-border p-6" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold text-2xl shrink-0">
            {emp.fullName.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold font-cairo text-foreground">{emp.fullName}</h1>
              {isExcessive && <span className="badge-warning">⚠️ غياب مفرط</span>}
            </div>
            <p className="text-muted-foreground mt-1">{emp.role}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {emp.skills.map((s) => (
                <span key={s} className="bg-primary/10 text-primary text-xs px-2.5 py-1 rounded-full font-medium">{s}</span>
              ))}
            </div>
          </div>
          <Button variant="outline" onClick={() => setShowEdit(true)} className="font-cairo">تعديل البيانات</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold font-cairo text-foreground">المعلومات الشخصية</h2>
          {infoItems.map((item) => (
            <div key={item.label} className="flex items-center gap-3">
              <item.icon className="text-muted-foreground shrink-0" size={16} />
              <div>
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm text-foreground">{item.value}</p>
              </div>
            </div>
          ))}
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">الراتب</p>
            <p className="text-lg font-bold text-foreground font-cairo">{emp.salary.toLocaleString("ar-EG")} ج.م</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">اللغات</p>
            <p className="text-sm text-foreground">{emp.languages.join(" • ") || "غير محدد"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">الجنسية</p>
            <p className="text-sm text-foreground">{emp.nationality || "غير محدد"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">النوع</p>
            <p className="text-sm text-foreground">{emp.gender === "male" ? "ذكر" : "أنثى"}</p>
          </div>
        </div>

        {/* Attendance */}
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold font-cairo text-foreground mb-4">الحضور والغياب</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-success/10 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-success">{present}</p>
              <p className="text-xs text-muted-foreground font-cairo">أيام حضور</p>
            </div>
            <div className={`rounded-lg p-3 text-center ${isExcessive ? "bg-destructive/10" : "bg-warning/10"}`}>
              <p className={`text-2xl font-bold ${isExcessive ? "text-destructive" : "text-warning"}`}>{absent}</p>
              <p className="text-xs text-muted-foreground font-cairo">أيام غياب</p>
            </div>
          </div>
          {isExcessive && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-warning/30 bg-warning/5">
              <AlertTriangle className="text-warning shrink-0" size={16} />
              <p className="text-xs text-warning font-cairo">تحذير: هذا الموظف تجاوز الحد المسموح للغياب</p>
            </div>
          )}
          {/* Progress */}
          <div className="mt-4">
            <p className="text-xs text-muted-foreground mb-1">نسبة الحضور</p>
            <div className="w-full bg-muted rounded-full h-2.5">
              <div
                className="bg-success h-2.5 rounded-full transition-all"
                style={{ width: `${present + absent > 0 ? (present / (present + absent)) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0}%</p>
          </div>
        </div>

        {/* Tasks */}
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="font-bold font-cairo text-foreground mb-4">المهام ({empTasks.length})</h2>
          <div className="space-y-3">
            {empTasks.map((task) => {
              const deadline = new Date(task.deadline);
              const created = new Date(task.createdAt);
              let timeDiff = "";
              if (task.completedAt) {
                const comp = new Date(task.completedAt);
                const diffMs = deadline.getTime() - comp.getTime();
                const diffDays = Math.round(diffMs / 86400000);
                timeDiff = diffDays > 0 ? `قبل الموعد بـ ${diffDays} يوم` : diffDays < 0 ? `متأخر بـ ${Math.abs(diffDays)} يوم` : "في الموعد";
              }
              return (
                <div key={task.id} className="p-3 rounded-lg bg-muted/30 border border-border/50">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium font-cairo text-foreground">{task.title}</p>
                    <span className={task.status === "done" ? "badge-success" : task.status === "late" ? "badge-destructive" : "badge-info"}>
                      {task.status === "done" ? "مكتمل" : task.status === "late" ? "متأخر" : "قيد التنفيذ"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">أُسندت: {created.toLocaleDateString("ar-EG")}</p>
                  <p className="text-xs text-muted-foreground">الموعد النهائي: {deadline.toLocaleDateString("ar-EG")}</p>
                  {timeDiff && <p className="text-xs text-accent mt-1">{timeDiff}</p>}
                </div>
              );
            })}
            {empTasks.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا توجد مهام</p>}
          </div>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">تعديل بيانات الموظف</DialogTitle>
          </DialogHeader>
          <AddEmployeeForm onClose={() => setShowEdit(false)} editEmployee={emp} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
