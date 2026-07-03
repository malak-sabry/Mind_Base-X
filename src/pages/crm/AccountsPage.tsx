import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, Plus, Search, Pencil, Trash2, Globe, MapPin, Eye, TrendingUp, TrendingDown, Info as InfoIcon, FileText } from "lucide-react";
import { ACCOUNT_SIZES, ACCOUNT_STATUSES, INDUSTRIES, type CrmAccount } from "@/types/crm";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { AccountDetailsDialog } from "@/components/AccountDetailsDialog";

const empty: Partial<CrmAccount> = {
  name: "", industry: "تكنولوجيا", website: "", country: "مصر", city: "",
  size: "small", annualRevenue: 0, status: "prospect", notes: "",
  impactPercent: 0, outcomeSummary: "", onboardedAt: null,
};
const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

// Field-by-field guidance shown inside the form
const FieldHint = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[11px] text-muted-foreground font-cairo flex items-start gap-1 mt-1">
    <InfoIcon size={11} className="shrink-0 mt-0.5" /><span>{children}</span>
  </p>
);

export default function AccountsPage() {
  const { accounts, contacts, deals, saveAccount, deleteAccount } = useCrm();
  const { employees } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [q, setQ] = useState(""); const [statusF, setStatusF] = useState("all"); const [ownerF, setOwnerF] = useState("all");
  const [open, setOpen] = useState(false); const [form, setForm] = useState<Partial<CrmAccount>>(empty);
  const [detailAccount, setDetailAccount] = useState<CrmAccount | null>(null);

  const filtered = useMemo(() => accounts.filter(a => {
    const t = q.toLowerCase();
    const ok = !q || a.name.toLowerCase().includes(t) || a.industry.toLowerCase().includes(t) || a.city.toLowerCase().includes(t);
    return ok && (statusF === "all" || a.status === statusF) && (ownerF === "all" || a.ownerEmployeeId === ownerF);
  }), [accounts, q, statusF, ownerF]);

  const start = (a?: CrmAccount) => {
    const base = a ? { ...a } : { ...empty, ownerEmployeeId: user?.employeeId || null };
    setForm(base); setOpen(true);
  };
  const submit = async () => {
    if (!form.name?.trim()) { toast.error("اسم الشركة مطلوب — أدخل الاسم الرسمي للشركة كما يظهر في الأوراق"); return; }
    await saveAccount(form);
    toast.success(form.id ? "تم تحديث الشركة" : "تم إضافة الشركة");
    setOpen(false);
  };
  const remove = async (id: string) => {
    if (!confirm("هل أنت متأكد من حذف هذه الشركة؟ سيتم فقد كل بياناتها.")) return;
    await deleteAccount(id); toast.success("تم الحذف");
  };

  const ownerName = (id?: string | null) => employees.find(e => e.id === id)?.fullName || "—";

  return (
    <div className="space-y-5 font-cairo">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2"><Building2/> الشركات والحسابات</h1>
          <p className="text-muted-foreground mt-1">{accounts.length} شركة في قاعدة البيانات — اضغط على أي شركة لرؤية تفاصيلها وتقاريرها الكاملة.</p>
        </div>
        {!isManager && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={() => start()}><Plus className="ml-1" size={18}/> شركة جديدة</Button></DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" dir="rtl">
              <DialogHeader>
                <DialogTitle>{form.id ? "تعديل بيانات شركة" : "إضافة شركة جديدة"}</DialogTitle>
                <DialogDescription className="font-cairo">
                  أكمل بيانات الشركة بدقة — هذه البيانات تُستخدم لاحقاً لتقييم تأثير كل شركة على عملنا وفي توليد التقارير وتصديرها PDF/Excel.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Section: Basic */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="font-bold text-sm text-primary">١. البيانات الأساسية</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>اسم الشركة *</Label>
                      <Input placeholder="مثال: شركة النور للتجارة" value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })}/>
                      <FieldHint>الاسم القانوني للشركة — حقل إجباري ويظهر في التقارير.</FieldHint>
                    </div>
                    <div>
                      <Label>الصناعة</Label>
                      <Select value={form.industry} onValueChange={v => setForm({ ...form, industry: v })}>
                        <SelectTrigger><SelectValue placeholder="اختر الصناعة"/></SelectTrigger>
                        <SelectContent>{INDUSTRIES.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                      </Select>
                      <FieldHint>القطاع الذي تعمل فيه الشركة (مثل: تكنولوجيا، تجارة، تصنيع…).</FieldHint>
                    </div>
                    <div>
                      <Label>حجم الشركة</Label>
                      <Select value={form.size} onValueChange={(v: any) => setForm({ ...form, size: v })}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{ACCOUNT_SIZES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FieldHint>عدد الموظفين تقريباً — يساعد في تحديد أولوية المتابعة.</FieldHint>
                    </div>
                    <div>
                      <Label>البلد</Label>
                      <Input placeholder="مصر" value={form.country || ""} onChange={e => setForm({ ...form, country: e.target.value })}/>
                    </div>
                    <div>
                      <Label>المدينة</Label>
                      <Input placeholder="القاهرة" value={form.city || ""} onChange={e => setForm({ ...form, city: e.target.value })}/>
                    </div>
                    <div className="col-span-2">
                      <Label>الموقع الإلكتروني</Label>
                      <Input placeholder="https://example.com" value={form.website || ""} onChange={e => setForm({ ...form, website: e.target.value })}/>
                      <FieldHint>للوصول السريع لموقع الشركة من جدول الحسابات.</FieldHint>
                    </div>
                  </div>
                </div>

                {/* Section: Commercial */}
                <div className="rounded-lg border border-border p-3 space-y-3">
                  <h4 className="font-bold text-sm text-primary">٢. البيانات التجارية والمسؤولية</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>الإيرادات السنوية (ج.م)</Label>
                      <Input type="number" placeholder="0" value={form.annualRevenue || 0} onChange={e => setForm({ ...form, annualRevenue: Number(e.target.value) })}/>
                      <FieldHint>الإيراد السنوي التقريبي لهذه الشركة — يُستخدم لحساب أهمية الحساب.</FieldHint>
                    </div>
                    <div>
                      <Label>الحالة</Label>
                      <Select value={form.status} onValueChange={(v: any) => setForm({ ...form, status: v })}>
                        <SelectTrigger><SelectValue/></SelectTrigger>
                        <SelectContent>{ACCOUNT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                      <FieldHint>محتمل = ما زلنا نتفاوض، نشط = نتعامل معاً، غير نشط = توقف التعامل.</FieldHint>
                    </div>
                    <div>
                      <Label>الموظف المسؤول</Label>
                      <Select value={form.ownerEmployeeId || "none"} onValueChange={v => setForm({ ...form, ownerEmployeeId: v === "none" ? null : v })}>
                        <SelectTrigger><SelectValue placeholder="بدون مسؤول"/></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">— بدون مسؤول —</SelectItem>
                          {employees.map(e => <SelectItem key={e.id} value={e.id}>{e.fullName}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FieldHint>الموظف المسؤول عن متابعة هذا الحساب.</FieldHint>
                    </div>
                    <div>
                      <Label>تاريخ بدء التعامل</Label>
                      <Input type="date" value={form.onboardedAt || ""} onChange={e => setForm({ ...form, onboardedAt: e.target.value || null })}/>
                      <FieldHint>متى بدأت الشراكة الفعلية معنا؟ يظهر في الجدول الزمني للتقارير.</FieldHint>
                    </div>
                  </div>
                </div>

                {/* Section: Impact */}
                <div className="rounded-lg border border-border p-3 space-y-3 bg-muted/30">
                  <h4 className="font-bold text-sm text-primary">٣. تأثير الشركة على شركتنا (يُحدَّث بمرور الوقت)</h4>
                  <div>
                    <Label>نسبة التأثير %</Label>
                    <Input type="number" min={-100} max={100} step={1} placeholder="من -100 إلى +100" value={form.impactPercent ?? 0} onChange={e => setForm({ ...form, impactPercent: Number(e.target.value) })}/>
                    <FieldHint>
                      رقم من -100 إلى +100. القيم الموجبة تعني أن الشركة أثَّرت إيجاباً على شركتنا (أرباح، اسم، فرص). القيم السالبة تعني تأثيراً سلبياً (خسائر، مشاكل، تأخير).
                    </FieldHint>
                  </div>
                  <div>
                    <Label>ملخص النتائج</Label>
                    <Textarea rows={3} placeholder="ماذا حققت لنا هذه الشركة حتى الآن؟ مكاسب، صفقات، فرص، خسائر، تحديات..." value={form.outcomeSummary || ""} onChange={e => setForm({ ...form, outcomeSummary: e.target.value })}/>
                    <FieldHint>اكتب باختصار: المكاسب، التحديات، وأي شيء يساعد المدير في تقييم استمرار التعامل.</FieldHint>
                  </div>
                </div>

                {/* Section: Notes */}
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <h4 className="font-bold text-sm text-primary">٤. ملاحظات عامة</h4>
                  <Textarea placeholder="أي ملاحظات داخلية عن الشركة" value={form.notes || ""} onChange={e => setForm({ ...form, notes: e.target.value })} rows={3}/>
                  <FieldHint>ملاحظات حرة — لن تظهر للعميل، فقط للفريق الداخلي.</FieldHint>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={submit}>{form.id ? "حفظ التعديلات" : "إضافة الشركة"}</Button>
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
            <Input placeholder="ابحث باسم الشركة، الصناعة، أو المدينة..." value={q} onChange={e => setQ(e.target.value)} className="pr-10"/>
          </div>
          <Select value={statusF} onValueChange={setStatusF}>
            <SelectTrigger className="w-44"><SelectValue/></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">كل الحالات</SelectItem>
              {ACCOUNT_STATUSES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
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
                <TableHead className="text-right">الشركة</TableHead>
                <TableHead className="text-right">الصناعة</TableHead>
                <TableHead className="text-right">الموقع</TableHead>
                <TableHead className="text-right">الإيرادات</TableHead>
                <TableHead className="text-right">جهات</TableHead>
                <TableHead className="text-right">صفقات</TableHead>
                <TableHead className="text-right">التأثير</TableHead>
                <TableHead className="text-right">الحالة</TableHead>
                <TableHead className="text-right">المسؤول</TableHead>
                <TableHead className="text-right">تاريخ الإضافة</TableHead>
                <TableHead className="text-right w-32">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={11} className="text-center py-12 text-muted-foreground">لا توجد شركات</TableCell></TableRow>
              ) : filtered.map(a => {
                const st = ACCOUNT_STATUSES.find(s => s.value === a.status)!;
                const cCount = contacts.filter(c => c.accountId === a.id).length;
                const dCount = deals.filter(d => d.accountId === a.id).length;
                const positive = a.impactPercent >= 0;
                return (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setDetailAccount(a)}>
                    <TableCell>
                      <div className="font-medium">{a.name}</div>
                      {a.website && <a href={a.website.startsWith("http") ? a.website : `https://${a.website}`} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="text-xs text-primary flex items-center gap-1"><Globe size={11}/>{a.website}</a>}
                    </TableCell>
                    <TableCell><Badge variant="outline">{a.industry || "—"}</Badge></TableCell>
                    <TableCell className="text-sm"><span className="flex items-center gap-1"><MapPin size={12}/>{[a.city, a.country].filter(Boolean).join("، ") || "—"}</span></TableCell>
                    <TableCell className="font-medium">{fmt(a.annualRevenue)} ج.م</TableCell>
                    <TableCell>{cCount}</TableCell>
                    <TableCell>{dCount}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={positive ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-rose-500/15 text-rose-700 border-rose-500/30"}>
                        {positive ? <TrendingUp size={11} className="inline ml-1"/> : <TrendingDown size={11} className="inline ml-1"/>}
                        {a.impactPercent}%
                      </Badge>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={st.color}>{st.label}</Badge></TableCell>
                    <TableCell className="text-sm">{ownerName(a.ownerEmployeeId)}</TableCell>
                    <TableCell className="text-xs">{new Date(a.createdAt).toLocaleDateString("ar-EG")}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-1">
                        <Button size="icon" variant="ghost" title="تفاصيل وتقارير" onClick={() => setDetailAccount(a)}><FileText size={15}/></Button>
                        {!isManager && (
                          <>
                            <Button size="icon" variant="ghost" title="تعديل" onClick={() => start(a)}><Pencil size={15}/></Button>
                            <Button size="icon" variant="ghost" title="حذف" onClick={() => remove(a.id)}><Trash2 size={15} className="text-rose-600"/></Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AccountDetailsDialog account={detailAccount} open={!!detailAccount} onOpenChange={(v) => !v && setDetailAccount(null)} />
    </div>
  );
}
