import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Briefcase, Plus, Search, Pencil, Trash2, Eye } from "lucide-react";
import { DEAL_STAGES, DEAL_PRIORITIES, type CrmDeal } from "@/types/crm";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { CrmNotesButton } from "@/components/CrmNotesButton";
import { HistoryButton } from "@/components/HistoryButton";

const empty: Partial<CrmDeal> = { title: "", description: "", value: 0, currency: "EGP", stage: "new", probability: 10, priority: "medium", lostReason: "" };
const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

export default function DealsPage() {
  const { deals, accounts, contacts, saveDeal, deleteDeal } = useCrm();
  const { employees } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [q, setQ] = useState(""); const [stageF, setStageF] = useState("all"); const [prF, setPrF] = useState("all"); const [ownerF, setOwnerF] = useState("all");
  const [open, setOpen] = useState(false); const [form, setForm] = useState<Partial<CrmDeal>>(empty);

  const filtered = useMemo(() => deals.filter(d => {
    const t = q.toLowerCase();
    const ok = !q || d.title.toLowerCase().includes(t);
    return ok
      && (stageF === "all" || d.stage === stageF)
      && (prF === "all" || d.priority === prF)
      && (ownerF === "all" || d.ownerEmployeeId === ownerF);
  }), [deals, q, stageF, prF, ownerF]);

  const totalValue = filtered.reduce((s, d) => s + d.value, 0);

  const start = (d?: CrmDeal) => {
    setForm(d ? { ...d } : { ...empty, ownerEmployeeId: user?.employeeId || null });
    setOpen(true);
  };
  const submit = async () => {
    if (!form.title?.trim()) { toast.error("عنوان الصفقة مطلوب"); return; }
    await saveDeal(form);
    toast.success(form.id ? "تم التحديث" : "تم إضافة الصفقة");
    setOpen(false);
  };
  const ownerName = (id?: string | null) => employees.find(e => e.id === id)?.fullName || "—";

  return (
    <div className="space-y-5 font-cairo">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Briefcase/> الصفقات</h1>
          <p className="text-muted-foreground mt-1">{filtered.length} صفقة • القيمة الإجمالية: {fmt(totalValue)} ج.م</p>
        </div>
        <div className="flex gap-2 items-center">
          <Link to="/crm/pipeline"><Button variant="outline">عرض Pipeline</Button></Link>
          {!isManager && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button onClick={() => start()}><Plus className="ml-1" size={18}/> صفقة جديدة</Button></DialogTrigger>
              <DialogContent className="max-w-2xl" dir="rtl">
                <DialogHeader><DialogTitle>{form.id ? "تعديل صفقة" : "صفقة جديدة"}</DialogTitle></DialogHeader>
                <div className="grid grid-cols-2 gap-3">
                  <Input placeholder="عنوان الصفقة *" value={form.title || ""} onChange={e => setForm({ ...form, title: e.target.value })} className="col-span-2"/>
                  <Input type="number" placeholder="القيمة" value={form.value || 0} onChange={e => setForm({ ...form, value: Number(e.target.value) })}/>
                  <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EGP">جنيه مصري</SelectItem>
                      <SelectItem value="USD">دولار</SelectItem>
                      <SelectItem value="EUR">يورو</SelectItem>
                      <SelectItem value="SAR">ريال سعودي</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={form.stage} onValueChange={(v: any) => {
                    const stage = DEAL_STAGES.find(s => s.value === v)!;
                    setForm({ ...form, stage: v, probability: stage.defaultProb });
                  }}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{DEAL_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Input type="number" min={0} max={100} placeholder="احتمالية الفوز %" value={form.probability ?? 0} onChange={e => setForm({ ...form, probability: Number(e.target.value) })}/>
                  <Input type="date" value={form.expectedCloseDate || ""} onChange={e => setForm({ ...form, expectedCloseDate: e.target.value })}/>
                  <Select value={form.priority} onValueChange={(v: any) => setForm({ ...form, priority: v })}>
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>{DEAL_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <Select value={form.accountId || "none"} onValueChange={v => setForm({ ...form, accountId: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="الشركة"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— بدون —</SelectItem>
                      {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.contactId || "none"} onValueChange={v => setForm({ ...form, contactId: v === "none" ? null : v })}>
                    <SelectTrigger><SelectValue placeholder="جهة الاتصال"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— بدون —</SelectItem>
                      {contacts.map(c => <SelectItem key={c.id} value={c.id}>{c.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Select value={form.ownerEmployeeId || "none"} onValueChange={v => setForm({ ...form, ownerEmployeeId: v === "none" ? null : v })}>
                    <SelectTrigger className="col-span-2"><SelectValue placeholder="الموظف المسؤول"/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— بدون مسؤول —</SelectItem>
                      {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Textarea placeholder="وصف الصفقة" value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="col-span-2" rows={3}/>
                  {form.stage === "lost" && (
                    <Textarea placeholder="سبب الخسارة" value={form.lostReason || ""} onChange={e => setForm({ ...form, lostReason: e.target.value })} className="col-span-2" rows={2}/>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                  <Button onClick={submit}>{form.id ? "حفظ" : "إضافة"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          {isManager && (
            <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5"><Eye size={13}/> عرض فقط</Badge>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16}/>
            <Input placeholder="ابحث في الصفقات..." value={q} onChange={e => setQ(e.target.value)} className="pr-10"/>
          </div>
          <Select value={stageF} onValueChange={setStageF}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل المراحل</SelectItem>
              {DEAL_STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={prF} onValueChange={setPrF}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الأولويات</SelectItem>
              {DEAL_PRIORITIES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ownerF} onValueChange={setOwnerF}>
            <SelectTrigger className="w-48"><SelectValue placeholder="الموظف المسؤول"/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الموظفين</SelectItem>
              {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الصفقة</TableHead>
                <TableHead className="text-right">الشركة</TableHead>
                <TableHead className="text-right">القيمة</TableHead>
                <TableHead className="text-right">المرحلة</TableHead>
                <TableHead className="text-right">الاحتمالية</TableHead>
                <TableHead className="text-right">تاريخ الإغلاق</TableHead>
                <TableHead className="text-right">الأولوية</TableHead>
                <TableHead className="text-right">الموظف المسؤول</TableHead>
                <TableHead className="text-right w-32">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-12 text-muted-foreground">لا توجد صفقات</TableCell></TableRow>
              ) : filtered.map(d => {
                const st = DEAL_STAGES.find(s => s.value === d.stage)!;
                const pr = DEAL_PRIORITIES.find(p => p.value === d.priority)!;
                const acc = accounts.find(a => a.id === d.accountId);
                return (
                  <TableRow key={d.id}>
                    <TableCell>
                      <div className="font-medium">{d.title}</div>
                      {d.description && <div className="text-xs text-muted-foreground line-clamp-1">{d.description}</div>}
                    </TableCell>
                    <TableCell className="text-sm">{acc?.name || "—"}</TableCell>
                    <TableCell className="font-bold">{fmt(d.value)} {d.currency}</TableCell>
                    <TableCell><Badge variant="outline" className={st.color}>{st.label}</Badge></TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-muted overflow-hidden">
                          <div className="h-full bg-primary" style={{ width: `${d.probability}%` }}/>
                        </div>
                        <span className="text-xs">{d.probability}%</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{d.expectedCloseDate ? new Date(d.expectedCloseDate).toLocaleDateString("ar-EG") : "—"}</TableCell>
                    <TableCell><Badge className={pr.color} variant="outline">{pr.label}</Badge></TableCell>
                    <TableCell className="text-sm">{ownerName(d.ownerEmployeeId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <CrmNotesButton entityType="deal" entityId={d.id} entityTitle={d.title} />
                        <HistoryButton entityType="deal" entityId={d.id} title={d.title} />
                        {!isManager && <>
                          <Button size="icon" variant="ghost" onClick={() => start(d)}><Pencil size={15}/></Button>
                          <Button size="icon" variant="ghost" onClick={async () => { if (confirm("حذف الصفقة؟")) { await deleteDeal(d.id); toast.success("تم الحذف"); } }}><Trash2 size={15} className="text-rose-600"/></Button>
                        </>}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
