import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, Plus, Search, Pencil, Trash2, Mail, Phone, Eye } from "lucide-react";
import { CONTACT_STATUSES, type CrmContact } from "@/types/crm";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { HistoryButton } from "@/components/HistoryButton";

const empty: Partial<CrmContact> = { fullName: "", email: "", phone: "", jobTitle: "", status: "lead", source: "", tags: [], notes: "" };

export default function ContactsPage() {
  const { contacts, accounts, saveContact, deleteContact } = useCrm();
  const { employees } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [q, setQ] = useState(""); const [statusF, setStatusF] = useState("all"); const [accF, setAccF] = useState("all"); const [ownerF, setOwnerF] = useState("all");
  const [open, setOpen] = useState(false); const [form, setForm] = useState<Partial<CrmContact>>(empty);

  const filtered = useMemo(() => contacts.filter(c => {
    const t = q.toLowerCase();
    const ok = !q || c.fullName.toLowerCase().includes(t) || c.email.toLowerCase().includes(t) || c.phone.includes(q) || c.jobTitle.toLowerCase().includes(t);
    return ok && (statusF === "all" || c.status === statusF) && (accF === "all" || c.accountId === accF) && (ownerF === "all" || c.ownerEmployeeId === ownerF);
  }), [contacts, q, statusF, accF, ownerF]);

  const start = (c?: CrmContact) => {
    setForm(c ? { ...c } : { ...empty, ownerEmployeeId: user?.employeeId || null });
    setOpen(true);
  };
  const submit = async () => {
    if (!form.fullName?.trim()) { toast.error("الاسم مطلوب"); return; }
    await saveContact(form);
    toast.success(form.id ? "تم التحديث" : "تم إضافة جهة الاتصال");
    setOpen(false);
  };
  const remove = async (id: string) => {
    if (!confirm("حذف جهة الاتصال؟")) return;
    await deleteContact(id); toast.success("تم الحذف");
  };
  const ownerName = (id?: string | null) => employees.find(e => e.id === id)?.fullName || "—";

  return (
    <div className="space-y-5 font-cairo">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Users/> جهات الاتصال</h1>
          <p className="text-muted-foreground mt-1">{contacts.length} جهة اتصال</p>
        </div>
        {!isManager && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={() => start()}><Plus className="ml-1" size={18}/> جهة اتصال جديدة</Button></DialogTrigger>
            <DialogContent className="max-w-2xl" dir="rtl">
              <DialogHeader><DialogTitle>{form.id ? "تعديل" : "جهة اتصال جديدة"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="الاسم الكامل *" value={form.fullName || ""} onChange={e => setForm({ ...form, fullName: e.target.value })} className="col-span-2"/>
                <Input placeholder="البريد الإلكتروني" type="email" value={form.email || ""} onChange={e => setForm({ ...form, email: e.target.value })}/>
                <Input placeholder="الهاتف" value={form.phone || ""} onChange={e => setForm({ ...form, phone: e.target.value })}/>
                <Input placeholder="المنصب الوظيفي" value={form.jobTitle || ""} onChange={e => setForm({ ...form, jobTitle: e.target.value })}/>
                <Select value={form.accountId || "none"} onValueChange={v => setForm({ ...form, accountId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="الشركة"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون شركة —</SelectItem>
                    {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>{CONTACT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                </Select>
                <Select value={form.ownerEmployeeId || "none"} onValueChange={v => setForm({ ...form, ownerEmployeeId: v === "none" ? null : v })}>
                  <SelectTrigger><SelectValue placeholder="الموظف المسؤول"/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— بدون مسؤول —</SelectItem>
                    {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Input placeholder="مصدر العميل (موقع، إعلان، توصية...)" value={form.source || ""} onChange={e => setForm({ ...form, source: e.target.value })}/>
                <Textarea placeholder="ملاحظات" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} className="col-span-2" rows={3}/>
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
            <Input placeholder="ابحث بالاسم، البريد، الهاتف..." value={q} onChange={e => setQ(e.target.value)} className="pr-10"/>
          </div>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {CONTACT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={accF} onValueChange={setAccF}>
            <SelectTrigger className="w-48"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الشركات</SelectItem>
              {accounts.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
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
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">المنصب</TableHead>
                <TableHead className="text-right">الشركة</TableHead>
                <TableHead className="text-right">الاتصال</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المصدر</TableHead>
                <TableHead className="text-right">الموظف المسؤول</TableHead>
                <TableHead className="text-right w-28">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-12 text-muted-foreground">لا توجد جهات اتصال</TableCell></TableRow>
              ) : filtered.map(c => {
                const st = CONTACT_STATUSES.find(s => s.value === c.status)!;
                const acc = accounts.find(a => a.id === c.accountId);
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">{c.fullName.charAt(0)}</div>
                        <span className="font-medium">{c.fullName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{c.jobTitle || "—"}</TableCell>
                    <TableCell className="text-sm">{acc?.name || "—"}</TableCell>
                    <TableCell className="text-xs space-y-1">
                      {c.email && <div className="flex items-center gap-1"><Mail size={11}/>{c.email}</div>}
                      {c.phone && <div className="flex items-center gap-1"><Phone size={11}/>{c.phone}</div>}
                    </TableCell>
                    <TableCell><Badge variant="outline" className={st.color}>{st.label}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground">{c.source || "—"}</TableCell>
                    <TableCell className="text-sm">{ownerName(c.ownerEmployeeId)}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <HistoryButton entityType="contact" entityId={c.id} title={c.fullName} />
                        {!isManager && <>
                          <Button size="icon" variant="ghost" onClick={() => start(c)}><Pencil size={15}/></Button>
                          <Button size="icon" variant="ghost" onClick={() => remove(c.id)}><Trash2 size={15} className="text-rose-600"/></Button>
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