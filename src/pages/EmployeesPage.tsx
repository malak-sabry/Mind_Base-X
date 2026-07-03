import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Trash2, Edit, Eye, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS } from "@/types/hr";
import { AddEmployeeForm } from "@/components/AddEmployeeForm";

export default function EmployeesPage() {
  const { employees, deleteEmployee, hasExcessiveAbsence, resetEmployeeLogin } = useHR();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [resetTarget, setResetTarget] = useState<{ id: string; email: string } | null>(null);
  const [resetPwd, setResetPwd] = useState("");

  const filtered = employees.filter((e) => {
    const matchSearch = e.fullName.includes(search) || e.role.includes(search) || e.email.includes(search);
    const matchDept = !deptFilter || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">شؤون الموظفين</h1>
          <p className="text-muted-foreground text-sm mt-1">{employees.length} موظف مسجل — النقطة الخضراء تعني أن الموظف فاتح حسابه الآن</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-primary-foreground gap-2">
          <Plus size={18} />
          <span className="font-cairo">إضافة موظف</span>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="بحث بالاسم أو الوظيفة أو الإيميل..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo">
          <option value="">كل الأقسام</option>
          {DEPARTMENTS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((emp) => (
          <div key={emp.id} className="stat-card relative">
            {hasExcessiveAbsence(emp) && (
              <span className="absolute top-3 left-3 badge-warning text-[10px]">⚠️ غياب مفرط</span>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div className="relative shrink-0">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                  {emp.fullName.charAt(0)}
                </div>
                <span
                  title={emp.isOnline ? "متصل الآن" : "غير متصل"}
                  className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full ring-2 ring-card ${emp.isOnline ? "bg-emerald-500" : "bg-slate-400"}`}
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-foreground font-cairo truncate">{emp.fullName}</h3>
                <p className="text-xs text-muted-foreground">{emp.role}</p>
                <p className="text-[10px] text-muted-foreground font-cairo mt-0.5">
                  {emp.isOnline ? "🟢 متصل الآن — موجود في الشركة" : emp.lastLogoutAt ? `🔘 آخر خروج: ${new Date(emp.lastLogoutAt).toLocaleString("ar-EG")}` : "🔘 لم يسجّل دخول بعد"}
                </p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{DEPARTMENTS.find((d) => d.value === emp.department)?.label || emp.department}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-xs" onClick={() => navigate(`/employees/${emp.id}`)}>
                <Eye size={14} /> <span className="font-cairo">عرض</span>
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => navigate(`/employees/${emp.id}?edit=true`)}>
                <Edit size={14} />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs" title="إعادة تعيين بيانات الدخول" onClick={() => { setResetTarget({ id: emp.id, email: emp.email }); setResetPwd(""); }}>
                <KeyRound size={14} />
              </Button>
              <Button size="sm" variant="outline" className="gap-1 text-xs text-destructive hover:bg-destructive/10" onClick={() => setDeleteConfirm(emp.id)}>
                <Trash2 size={14} />
              </Button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-10 font-cairo">لا يوجد موظفين مطابقين للبحث</p>
      )}

      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-cairo">إضافة موظف جديد</DialogTitle></DialogHeader>
          <AddEmployeeForm onClose={() => setShowAddForm(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-cairo">تأكيد الحذف</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground font-cairo">هل أنت متأكد من حذف هذا الموظف؟ سيتم حذف جميع مهامه أيضاً.</p>
          <div className="flex gap-3 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirm(null)} className="flex-1 font-cairo">إلغاء</Button>
            <Button variant="destructive" className="flex-1 font-cairo" onClick={() => { if (deleteConfirm) deleteEmployee(deleteConfirm); setDeleteConfirm(null); }}>حذف</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle className="font-cairo">إعادة تعيين حساب الدخول</DialogTitle></DialogHeader>
          <p className="text-xs text-muted-foreground font-cairo">سيتم إنشاء/تحديث حساب دخول للبريد: <strong className="text-foreground">{resetTarget?.email}</strong>. الموظف سيُطلب منه تغيير كلمة المرور عند أول دخول.</p>
          <Input type="text" placeholder="كلمة المرور الجديدة (8 أحرف على الأقل)" value={resetPwd} onChange={(e) => setResetPwd(e.target.value)} className="font-cairo mt-2" />
          <div className="flex gap-3 mt-3">
            <Button variant="outline" className="flex-1 font-cairo" onClick={() => setResetTarget(null)}>إلغاء</Button>
            <Button className="flex-1 font-cairo gradient-primary text-primary-foreground" disabled={resetPwd.length < 8} onClick={async () => {
              if (!resetTarget) return;
              const ok = await resetEmployeeLogin(resetTarget.id, resetPwd);
              if (ok) setResetTarget(null);
            }}>تأكيد</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
