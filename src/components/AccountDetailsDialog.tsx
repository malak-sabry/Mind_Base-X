import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Building2, FileSpreadsheet, FileText, TrendingUp, TrendingDown, Calendar, Globe, MapPin, Wallet, Briefcase, User, ClipboardList, History } from "lucide-react";
import { ACCOUNT_SIZES, ACCOUNT_STATUSES, type CrmAccount } from "@/types/crm";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { supabase } from "@/integrations/supabase/client";
import { CrmHistoryTimeline } from "@/components/CrmHistoryTimeline";

interface Props {
  account: CrmAccount | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface CrmNote {
  id: string;
  author_name: string;
  author_role: string;
  note: string;
  created_at: string;
}

const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
const fmtDate = (d?: string | null) => d ? new Date(d).toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }) : "—";
const fmtDateTime = (d?: string | null) => d ? new Date(d).toLocaleString("ar-EG") : "—";

export function AccountDetailsDialog({ account, open, onOpenChange }: Props) {
  const { deals, activities, contacts } = useCrm();
  const { employees } = useHR();
  const [notes, setNotes] = useState<CrmNote[]>([]);

  useEffect(() => {
    if (!open || !account) return;
    supabase.from("crm_notes")
      .select("*").eq("entity_type", "account").eq("entity_id", account.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => setNotes((data || []) as CrmNote[]));
  }, [open, account?.id]);

  const accountDeals = useMemo(() => account ? deals.filter(d => d.accountId === account.id) : [], [deals, account]);
  const accountActivities = useMemo(() => account ? activities.filter(a => a.accountId === account.id) : [], [activities, account]);
  const accountContacts = useMemo(() => account ? contacts.filter(c => c.accountId === account.id) : [], [contacts, account]);

  const ownerName = employees.find(e => e.id === account?.ownerEmployeeId)?.fullName || "—";

  const wonValue = accountDeals.filter(d => d.stage === "won").reduce((s, d) => s + d.value, 0);
  const lostValue = accountDeals.filter(d => d.stage === "lost").reduce((s, d) => s + d.value, 0);
  const openValue = accountDeals.filter(d => d.stage !== "won" && d.stage !== "lost").reduce((s, d) => s + d.value, 0);

  // Build timeline (must run before any early-return to keep hooks order stable)
  const timeline = useMemo(() => {
    if (!account) return [] as { date: string; type: string; title: string; detail: string; }[];
    const items: { date: string; type: string; title: string; detail: string; }[] = [];
    items.push({ date: account.createdAt, type: "added", title: "تمت إضافة الشركة", detail: `بواسطة ${ownerName}` });
    if (account.onboardedAt) items.push({ date: account.onboardedAt, type: "onboard", title: "بدء التعامل الرسمي", detail: "تم تفعيل الشراكة" });
    accountDeals.forEach(d => {
      items.push({ date: d.createdAt, type: "deal", title: `صفقة: ${d.title}`, detail: `قيمة ${fmt(d.value)} ج.م — ${d.stage}` });
      if (d.closedAt) items.push({ date: d.closedAt, type: d.stage, title: `إغلاق صفقة: ${d.title}`, detail: d.stage === "won" ? "تم الفوز" : "خسارة" });
    });
    accountActivities.forEach(a => {
      items.push({ date: a.scheduledAt || a.createdAt, type: "activity", title: `نشاط: ${a.title}`, detail: a.outcome || a.description || a.type });
    });
    notes.forEach(n => {
      items.push({ date: n.created_at, type: "note", title: `ملاحظة من ${n.author_name}`, detail: n.note });
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [account, accountDeals, accountActivities, notes, ownerName]);

  if (!account) return null;

  const status = ACCOUNT_STATUSES.find(s => s.value === account.status);
  const size = ACCOUNT_SIZES.find(s => s.value === account.size);

  const impactPositive = account.impactPercent >= 0;
  const impactAbs = Math.min(100, Math.abs(account.impactPercent));

  const exportExcel = () => {
    const rows: string[][] = [];
    rows.push(["تقرير شركة", account.name]);
    rows.push(["تاريخ الإضافة", fmtDate(account.createdAt)]);
    rows.push(["بدء التعامل", fmtDate(account.onboardedAt)]);
    rows.push(["الصناعة", account.industry]);
    rows.push(["الحجم", size?.label || ""]);
    rows.push(["الموقع", [account.city, account.country].filter(Boolean).join("، ")]);
    rows.push(["الموقع الإلكتروني", account.website]);
    rows.push(["الإيرادات السنوية (ج.م)", String(account.annualRevenue)]);
    rows.push(["الحالة", status?.label || ""]);
    rows.push(["الموظف المسؤول", ownerName]);
    rows.push(["نسبة التأثير %", `${account.impactPercent}`]);
    rows.push(["نوع التأثير", impactPositive ? "إيجابي" : "سلبي"]);
    rows.push(["ملخص النتائج", account.outcomeSummary]);
    rows.push(["ملاحظات عامة", account.notes]);
    rows.push([]);
    rows.push(["صفقات مفتوحة (ج.م)", String(openValue)]);
    rows.push(["صفقات فائزة (ج.م)", String(wonValue)]);
    rows.push(["صفقات خاسرة (ج.م)", String(lostValue)]);
    rows.push([]);
    rows.push(["—— الجدول الزمني ——"]);
    rows.push(["التاريخ", "النوع", "العنوان", "التفاصيل"]);
    timeline.forEach(t => rows.push([fmtDateTime(t.date), t.type, t.title, t.detail]));

    const csv = "\uFEFF" + rows.map(r => r.map(c => `"${(c || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${account.name}-تقرير.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const w = window.open("", "_blank", "width=900,height=700");
    if (!w) return;
    const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const html = `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"/><title>${esc(account.name)} — تقرير</title>
      <style>
        body{font-family:'Cairo','Segoe UI',sans-serif;padding:32px;color:#111;}
        h1{margin:0 0 4px;font-size:24px}
        h2{margin:24px 0 8px;font-size:16px;border-bottom:2px solid #6366f1;padding-bottom:4px;color:#4338ca}
        table{width:100%;border-collapse:collapse;margin-top:8px;font-size:13px}
        td,th{border:1px solid #e5e7eb;padding:6px 8px;text-align:right}
        th{background:#f9fafb}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:8px 24px;font-size:13px;margin-top:8px}
        .grid div{padding:4px 0;border-bottom:1px dotted #e5e7eb}
        .impact{display:inline-block;padding:6px 12px;border-radius:8px;font-weight:bold;margin-top:6px}
        .pos{background:#dcfce7;color:#15803d} .neg{background:#fee2e2;color:#b91c1c}
        .muted{color:#6b7280;font-size:12px}
        @media print { body{padding:16px} }
      </style></head><body>
      <h1>${esc(account.name)}</h1>
      <div class="muted">تم إنشاء التقرير: ${esc(fmtDateTime(new Date().toISOString()))}</div>
      <h2>البيانات الأساسية</h2>
      <div class="grid">
        <div><b>تاريخ الإضافة:</b> ${esc(fmtDate(account.createdAt))}</div>
        <div><b>بدء التعامل:</b> ${esc(fmtDate(account.onboardedAt))}</div>
        <div><b>الصناعة:</b> ${esc(account.industry || "—")}</div>
        <div><b>الحجم:</b> ${esc(size?.label || "—")}</div>
        <div><b>الموقع:</b> ${esc([account.city, account.country].filter(Boolean).join("، ") || "—")}</div>
        <div><b>الموقع الإلكتروني:</b> ${esc(account.website || "—")}</div>
        <div><b>الإيرادات السنوية:</b> ${esc(fmt(account.annualRevenue))} ج.م</div>
        <div><b>الحالة:</b> ${esc(status?.label || "—")}</div>
        <div><b>الموظف المسؤول:</b> ${esc(ownerName)}</div>
      </div>
      <h2>تأثير الشركة على شركتنا</h2>
      <div class="impact ${impactPositive ? "pos" : "neg"}">${impactPositive ? "إيجابي" : "سلبي"} بنسبة ${esc(impactAbs)}%</div>
      <p>${esc(account.outcomeSummary || "لم يُسجَّل ملخص بعد.")}</p>
      <h2>الصفقات</h2>
      <table><thead><tr><th>العنوان</th><th>المرحلة</th><th>القيمة</th><th>تاريخ الإنشاء</th><th>تاريخ الإغلاق</th></tr></thead><tbody>
        ${accountDeals.map(d => `<tr><td>${esc(d.title)}</td><td>${esc(d.stage)}</td><td>${esc(fmt(d.value))} ج.م</td><td>${esc(fmtDate(d.createdAt))}</td><td>${esc(fmtDate(d.closedAt))}</td></tr>`).join("") || `<tr><td colspan="5" style="text-align:center;color:#6b7280">لا توجد صفقات</td></tr>`}
      </tbody></table>
      <h2>الجدول الزمني الكامل</h2>
      <table><thead><tr><th>التاريخ</th><th>الحدث</th><th>التفاصيل</th></tr></thead><tbody>
        ${timeline.map(t => `<tr><td>${esc(fmtDateTime(t.date))}</td><td>${esc(t.title)}</td><td>${esc(t.detail)}</td></tr>`).join("")}
      </tbody></table>
      <h2>ملاحظات عامة</h2>
      <p style="white-space:pre-wrap">${esc(account.notes || "—")}</p>
      <script>window.onload=()=>{setTimeout(()=>window.print(),300);};</script>
      </body></html>`;
    w.document.write(html); w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo flex items-center gap-2 text-xl">
            <Building2 /> {account.name}
            {status && <Badge variant="outline" className={status.color}>{status.label}</Badge>}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap gap-2 mb-4">
          <Button size="sm" variant="outline" onClick={exportPDF} className="gap-1 font-cairo"><FileText size={15}/> طباعة / PDF</Button>
          <Button size="sm" variant="outline" onClick={exportExcel} className="gap-1 font-cairo"><FileSpreadsheet size={15}/> تصدير Excel</Button>
        </div>

        {/* Basic info grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-cairo">
          <Info icon={Calendar} label="تاريخ الإضافة" value={fmtDate(account.createdAt)} />
          <Info icon={Calendar} label="بدء التعامل الرسمي" value={fmtDate(account.onboardedAt)} />
          <Info icon={Briefcase} label="الصناعة" value={account.industry || "—"} />
          <Info icon={Building2} label="الحجم" value={size?.label || "—"} />
          <Info icon={MapPin} label="الموقع" value={[account.city, account.country].filter(Boolean).join("، ") || "—"} />
          <Info icon={Globe} label="الموقع الإلكتروني" value={account.website || "—"} />
          <Info icon={Wallet} label="الإيرادات السنوية" value={`${fmt(account.annualRevenue)} ج.م`} />
          <Info icon={User} label="الموظف المسؤول" value={ownerName} />
        </div>

        <Separator className="my-4" />

        {/* Impact */}
        <div className="rounded-xl border border-border p-4 bg-muted/30">
          <h3 className="font-cairo font-bold flex items-center gap-2 mb-2">
            {impactPositive ? <TrendingUp className="text-emerald-600" size={18}/> : <TrendingDown className="text-rose-600" size={18}/>}
            تأثير هذه الشركة على شركتنا
          </h3>
          <div className="flex items-center gap-3 mb-2">
            <Badge className={impactPositive ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" : "bg-rose-500/15 text-rose-700 border-rose-500/30"} variant="outline">
              {impactPositive ? "إيجابي" : "سلبي"} — {impactAbs}%
            </Badge>
          </div>
          <Progress value={impactAbs} className="h-2" />
          {account.outcomeSummary && (
            <p className="text-sm font-cairo mt-3 whitespace-pre-wrap text-foreground/90">{account.outcomeSummary}</p>
          )}
        </div>

        {/* Deals summary */}
        <Separator className="my-4" />
        <div className="grid grid-cols-3 gap-3 font-cairo">
          <Stat label="صفقات مفتوحة" value={`${fmt(openValue)} ج.م`} color="text-blue-600" />
          <Stat label="صفقات فائزة" value={`${fmt(wonValue)} ج.م`} color="text-emerald-600" />
          <Stat label="صفقات خاسرة" value={`${fmt(lostValue)} ج.م`} color="text-rose-600" />
        </div>

        {/* Timeline */}
        <Separator className="my-4" />
        <div>
          <h3 className="font-cairo font-bold mb-3 flex items-center gap-2"><ClipboardList size={18}/> الجدول الزمني للتعامل</h3>
          {timeline.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 font-cairo">لا توجد أحداث مسجّلة بعد.</p>
          ) : (
            <div className="space-y-2">
              {timeline.map((t, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
                  <div className="text-xs text-muted-foreground font-cairo min-w-[120px]">{fmtDateTime(t.date)}</div>
                  <div className="flex-1">
                    <div className="text-sm font-cairo font-semibold">{t.title}</div>
                    <div className="text-xs text-muted-foreground font-cairo whitespace-pre-wrap">{t.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Change log */}
        <Separator className="my-4" />
        <div>
          <h3 className="font-cairo font-bold mb-3 flex items-center gap-2"><History size={18}/> سجل التغييرات (قبل/بعد)</h3>
          <CrmHistoryTimeline
            entityType="account"
            entityId={account.id}
            fieldLabels={{
              name: "الاسم", industry: "الصناعة", status: "الحالة", size: "الحجم",
              city: "المدينة", country: "الدولة", website: "الموقع", annual_revenue: "الإيرادات السنوية",
              owner_employee_id: "الموظف المسؤول", impact_percent: "نسبة التأثير %",
              outcome_summary: "ملخص النتائج", onboarded_at: "تاريخ بدء التعامل", notes: "ملاحظات",
            }}
            formatValue={(field, value) => {
              if (!value) return "—";
              if (field === "owner_employee_id") return employees.find(e => e.id === value)?.fullName || "—";
              if (field === "onboarded_at") { try { return new Date(value).toLocaleDateString("ar-EG"); } catch { return value; } }
              return value.length > 80 ? value.slice(0, 80) + "…" : value;
            }}
            maxHeight="300px"
          />
        </div>

        {/* Contacts */}
        {accountContacts.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="font-cairo font-bold mb-2">جهات الاتصال ({accountContacts.length})</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {accountContacts.map(c => (
                  <div key={c.id} className="text-sm font-cairo p-2 rounded-lg border border-border">
                    <div className="font-semibold">{c.fullName}</div>
                    <div className="text-xs text-muted-foreground">{c.jobTitle} • {c.phone} • {c.email}</div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Info({ icon: Icon, label, value }: any) {
  return (
    <div className="flex items-start gap-2 p-2 rounded-lg border border-border bg-card">
      <Icon size={15} className="text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
        <div className="font-medium">{value}</div>
      </div>
    </div>
  );
}
function Stat({ label, value, color }: any) {
  return (
    <div className="p-3 rounded-lg border border-border bg-card text-center">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-lg font-bold ${color}`}>{value}</div>
    </div>
  );
}
