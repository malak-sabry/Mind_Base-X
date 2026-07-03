import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, Plus, Search, CheckCircle2, Trash2, Phone, Users as UsersIcon, Mail, CheckSquare, FileText, Eye } from "lucide-react";
import { ACTIVITY_TYPES, ACTIVITY_STATUSES, type CrmActivity, type ActivityType } from "@/types/crm";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const empty: Partial<CrmActivity> = { type: "call", title: "", description: "", status: "pending", durationMinutes: 30 };

const ICON_MAP: Record<ActivityType, any> = { call: Phone, meeting: UsersIcon, email: Mail, task: CheckSquare, note: FileText };

export default function ActivitiesPage() {
  const { activities, accounts, contacts, deals, saveActivity, completeActivity, deleteActivity } = useCrm();
  const { employees } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [q, setQ] = useState(""); const [typeF, setTypeF] = useState("all"); const [statusF, setStatusF] = useState("all"); const [ownerF, setOwnerF] = useState("all");
  const [open, setOpen] = useState(false); const [form, setForm] = useState<Partial<CrmActivity>>(empty);

  const filtered = useMemo(() => activities.filter(a => {
    const t = q.toLowerCase();
    const ok = !q || a.title.toLowerCase().includes(t) || a.description.toLowerCase().includes(t);
    return ok
      && (typeF === "all" || a.type === typeF)
      && (statusF === "all" || a.status === statusF)
      && (ownerF === "all" || a.ownerEmployeeId === ownerF);
  }), [activities, q, typeF, statusF, ownerF]);

  const start = (a?: CrmActivity) => {
    setForm(a ? { ...a } : { ...empty, ownerEmployeeId: user?.employeeId || null });
    setOpen(true);
  };
  const submit = async () => {
    if (!form.title?.trim()) { toast.error("عنوان النشاط مطلوب"); return; }
    await saveActivity(form);
    toast.success(form.id ? "تم التحديث" : "تم إضافة النشاط");
    setOpen(false);
  };
  const ownerName = (id?: string | null) => employees.find(e => e.id === id)?.fullName || "—";

  return (
    <div className="space-y-5 font-cairo">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Activity/> الأنشطة والمتابعات</h1>
          <p className="text-muted-foreground mt-1">{activities.length} نشاط مسجل</p>
        </div>
        {!isManager && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={() => start()}><Plus className="ml-1" size={18}/> نشاط جديد</Button></DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader><DialogTitle>{form.id ? "تعديل نشاط" : "نشاط جديد"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Select value={form.type} onValueChange={(v: any) => setForm({ ...form, type: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{ACTIVITY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <Input placeholder="عنوان النشاط *" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} className="col-span-2"/>
                <Input type="datetime-local" placeholder="موعد التنفيذ" value={form.scheduledAt ? form.scheduledAt.slice(0, 16) : ""} onChange={e => setForm({ ...form, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null })}/>
                <Input type="number" placeholder="المدة (دقائق)" value={form.durationMinutes || 0} onChange={e => setForm({ ...form, durationMinutes: Number(e.target.value) })}/>
                <Select value={form.contactId || "none"} onValueChange={v => setForm({ ...form, contactId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="جهة الاتصال"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون —</SelectItem>
                    {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.accountId || "none"} onValueChange={v => setForm({ ...form, accountId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="الشركة"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون —</SelectItem>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.dealId || "none"} onValueChange={v => setForm({ ...form, dealId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="الصفقة المرتبطة"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون —</SelectItem>
                    {deals.map(d => <SelectItem key={d.id} value={d.id}>{d.title}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.ownerEmployeeId || "none"} onValueChange={v => setForm({ ...form, ownerEmployeeId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="الموظف المسؤول"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون مسؤول —</SelectItem>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Textarea placeholder="التفاصيل" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="col-span-2" rows={3}/>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={submit}>{form.id ? "حفظ" : "إضافة"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
        {isManager && (
          <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5"><Eye size={13}/> وضع العرض فقط</Badge>
        )}
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/>
            <Input placeholder="ابحث في الأنشطة..." value={q} onChange={e => setQ(e.target.value)} className="pr-10"/>
          </div>
          <Select value={typeF} onValueChange={setTypeF}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأنواع</SelectItem>
              {ACTIVITY_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {ACTIVITY_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ownerF} onValueChange={setOwnerF}>
            <SelectTrigger className="w-48"><SelectValue placeholder="الموظف"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الموظفين</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4 space-y-3">
          {filtered.length === 0 ? (
            <p className="text-center py-12 text-muted-foreground">لا توجد أنشطة</p>
          ) : filtered.map(a => {
            const Icon = ICON_MAP[a.type];
            const st = ACTIVITY_STATUSES.find(s => s.value === a.status)!;
            const t = ACTIVITY_TYPES.find(x => x.value === a.type)!;
            const c = contacts.find(c => c.id === a.contactId);
            const acc = accounts.find(a2 => a2.id === a.accountId);
            const d = deals.find(d => d.id === a.dealId);
            const overdue = a.status === "pending" && a.scheduledAt && new Date(a.scheduledAt) < new Date();
            return (
              <div key={a.id} className={`flex items-start gap-3 p-4 rounded-lg border ${overdue ? "border-rose-500/40 bg-rose-500/5" : "border-border"}`}>
                <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground shrink-0">
                  <Icon size={18}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <div>
                      <h3 className="font-semibold">{a.title}</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {t.label}
                        {c && ` • ${c.fullName}`}
                        {acc && ` • ${acc.name}`}
                        {d && ` • صفقة: ${d.title}`}
                        {` • مسؤول: ${ownerName(a.ownerEmployeeId)}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={st.color}>{st.label}</Badge>
                      {a.scheduledAt && (
                        <span className={`text-xs ${overdue ? "text-rose-600 font-bold" : "text-muted-foreground"}`}>
                          {new Date(a.scheduledAt).toLocaleString("ar-EG", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  {a.description && <p className="text-sm text-muted-foreground mt-2">{a.description}</p>}
                  {a.outcome && <p className="text-sm mt-2 p-2 rounded bg-muted/50"><b>النتيجة: </b>{a.outcome}</p>}
                  {!isManager && (
                    <div className="flex gap-1 mt-2">
                      {a.status === "pending" && (
                        <Button size="sm" variant="outline" onClick={async () => { const o = prompt("نتيجة النشاط (اختياري):") || ""; await completeActivity(a.id, o); toast.success("تم الإنجاز"); }}>
                          <CheckCircle2 size={14} className="ml-1"/> إنجاز
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" onClick={() => start(a)}>تعديل</Button>
                      <Button size="sm" variant="ghost" onClick={async () => { if (confirm("حذف النشاط؟")) { await deleteActivity(a.id); toast.success("تم الحذف"); } }}>
                        <Trash2 size={14} className="text-rose-600"/>
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
