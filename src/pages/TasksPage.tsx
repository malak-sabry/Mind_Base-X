import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { Plus, Search, CheckCircle, Clock, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS } from "@/types/hr";
import { useNavigate } from "react-router-dom";

export default function TasksPage() {
  const { tasks, employees, addTask, completeTask, deleteTask, getEmployeeById } = useHR();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // Add form state
  const [form, setForm] = useState({ title: "", description: "", notes: "", assignedTo: "", deadline: "", priority: "medium" as "low" | "medium" | "high" });

  const filtered = tasks.filter((t) => {
    const emp = getEmployeeById(t.assignedTo);
    const matchSearch = t.title.includes(search) || t.description.includes(search) || (emp?.fullName.includes(search) ?? false);
    const matchStatus = !statusFilter || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.assignedTo || !form.deadline) return;
    addTask({
      title: form.title.trim(),
      description: form.description.trim(),
      notes: form.notes.trim(),
      assignedTo: form.assignedTo,
      deadline: new Date(form.deadline).toISOString(),
      priority: form.priority,
    });
    setForm({ title: "", description: "", notes: "", assignedTo: "", deadline: "", priority: "medium" });
    setShowAddForm(false);
  };

  const taskDetail = selectedTask ? tasks.find((t) => t.id === selectedTask) : null;
  const taskDetailEmp = taskDetail ? getEmployeeById(taskDetail.assignedTo) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">إدارة المهام</h1>
          <p className="text-muted-foreground text-sm mt-1">{tasks.length} مهمة</p>
        </div>
        <Button onClick={() => setShowAddForm(true)} className="gradient-primary text-primary-foreground gap-2">
          <Plus size={18} />
          <span className="font-cairo">إضافة مهمة</span>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="بحث بالمهمة أو الموظف..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo"
        >
          <option value="">كل الحالات</option>
          <option value="pending">قيد التنفيذ</option>
          <option value="done">مكتملة</option>
          <option value="late">متأخرة</option>
        </select>
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {filtered.map((task) => {
          const emp = getEmployeeById(task.assignedTo);
          const created = new Date(task.createdAt);
          const deadline = new Date(task.deadline);
          return (
            <div
              key={task.id}
              className="stat-card cursor-pointer"
              onClick={() => setSelectedTask(task.id)}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0 cursor-pointer"
                  onClick={(e) => { e.stopPropagation(); if (emp) navigate(`/employees/${emp.id}`); }}
                >
                  {emp?.fullName.charAt(0) || "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground font-cairo">{task.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {emp?.fullName || "غير معين"} • أُرسلت: {created.toLocaleDateString("ar-EG")} {created.toLocaleTimeString("ar-EG")}
                  </p>
                  <p className="text-xs text-muted-foreground">الموعد النهائي: {deadline.toLocaleDateString("ar-EG")}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={task.priority === "high" ? "badge-destructive" : task.priority === "medium" ? "badge-warning" : "badge-info"}>
                    {task.priority === "high" ? "عالية" : task.priority === "medium" ? "متوسطة" : "منخفضة"}
                  </span>
                  <span className={task.status === "done" ? "badge-success" : task.status === "late" ? "badge-destructive" : "badge-info"}>
                    {task.status === "done" ? "مكتمل" : task.status === "late" ? "متأخر" : "قيد التنفيذ"}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-10 font-cairo">لا توجد مهام مطابقة</p>}
      </div>

      {/* Add Task Dialog */}
      <Dialog open={showAddForm} onOpenChange={setShowAddForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-cairo">إضافة مهمة جديدة</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="space-y-4">
            <div>
              <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">اسم المهمة</label>
              <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="font-cairo" />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">وصف المهمة</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo min-h-[80px] resize-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">ملاحظات</label>
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo min-h-[60px] resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">الموظف المسؤول</label>
                <select
                  value={form.assignedTo}
                  onChange={(e) => setForm((p) => ({ ...p, assignedTo: e.target.value }))}
                  required
                  className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo"
                >
                  <option value="">اختر موظف</option>
                  {employees.filter((e) => e.status === "active").map((e) => (
                    <option key={e.id} value={e.id}>{e.fullName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">الأولوية</label>
                <select
                  value={form.priority}
                  onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo"
                >
                  <option value="low">منخفضة</option>
                  <option value="medium">متوسطة</option>
                  <option value="high">عالية</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">الموعد النهائي</label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm((p) => ({ ...p, deadline: e.target.value }))} required />
            </div>
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)} className="flex-1 font-cairo">إلغاء</Button>
              <Button type="submit" className="flex-1 gradient-primary text-primary-foreground font-cairo">إرسال المهمة</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Task Detail Dialog */}
      <Dialog open={!!selectedTask} onOpenChange={() => setSelectedTask(null)}>
        <DialogContent className="max-w-lg">
          {taskDetail && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cairo">{taskDetail.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground font-cairo">الوصف</p>
                  <p className="text-sm text-foreground mt-1">{taskDetail.description || "لا يوجد وصف"}</p>
                </div>
                {taskDetail.notes && (
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">الملاحظات</p>
                    <p className="text-sm text-foreground mt-1">{taskDetail.notes}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">الموظف</p>
                    <p className="text-sm text-foreground mt-1 cursor-pointer text-primary hover:underline" onClick={() => { setSelectedTask(null); if (taskDetailEmp) navigate(`/employees/${taskDetailEmp.id}`); }}>
                      {taskDetailEmp?.fullName || "غير معين"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">الحالة</p>
                    <span className={`mt-1 inline-block ${taskDetail.status === "done" ? "badge-success" : taskDetail.status === "late" ? "badge-destructive" : "badge-info"}`}>
                      {taskDetail.status === "done" ? "مكتمل" : taskDetail.status === "late" ? "متأخر" : "قيد التنفيذ"}
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">تاريخ الإرسال</p>
                    <p className="text-sm text-foreground mt-1">
                      {new Date(taskDetail.createdAt).toLocaleDateString("ar-EG")} {new Date(taskDetail.createdAt).toLocaleTimeString("ar-EG")}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">الموعد النهائي</p>
                    <p className="text-sm text-foreground mt-1">{new Date(taskDetail.deadline).toLocaleDateString("ar-EG")}</p>
                  </div>
                </div>
                {taskDetail.completedAt && (
                  <div>
                    <p className="text-xs text-muted-foreground font-cairo">وقت التسليم</p>
                    <p className="text-sm text-foreground mt-1">{new Date(taskDetail.completedAt).toLocaleDateString("ar-EG")} {new Date(taskDetail.completedAt).toLocaleTimeString("ar-EG")}</p>
                  </div>
                )}
                <div className="flex gap-3 pt-2">
                  {taskDetail.status === "pending" && (
                    <Button onClick={() => { completeTask(taskDetail.id); setSelectedTask(null); }} className="flex-1 bg-success text-success-foreground font-cairo gap-1">
                      <CheckCircle size={16} /> تم الإنجاز
                    </Button>
                  )}
                  <Button variant="outline" className="flex-1 text-destructive font-cairo gap-1" onClick={() => { deleteTask(taskDetail.id); setSelectedTask(null); }}>
                    <Trash2 size={16} /> حذف
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
