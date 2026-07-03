import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { History } from "lucide-react";
import { CrmHistoryTimeline } from "@/components/CrmHistoryTimeline";
import { useHR } from "@/contexts/HRContext";

interface Props {
  entityType: "account" | "deal" | "contact";
  entityId: string;
  title: string;
  variant?: "icon" | "button";
}

const DEAL_LABELS: Record<string, string> = {
  title: "العنوان", stage: "المرحلة", value: "القيمة", currency: "العملة",
  probability: "احتمالية الإغلاق", priority: "الأولوية", expected_close_date: "تاريخ الإغلاق المتوقع",
  closed_at: "تاريخ الإغلاق الفعلي", account_id: "الشركة", contact_id: "جهة الاتصال",
  owner_employee_id: "الموظف المسؤول", lost_reason: "سبب الخسارة", description: "الوصف",
};
const CONTACT_LABELS: Record<string, string> = {
  full_name: "الاسم", email: "البريد", phone: "الهاتف", job_title: "المسمى الوظيفي",
  status: "الحالة", source: "المصدر", account_id: "الشركة",
  owner_employee_id: "الموظف المسؤول", last_contacted_at: "آخر تواصل", notes: "ملاحظات",
};
const ACCOUNT_LABELS: Record<string, string> = {
  name: "الاسم", industry: "الصناعة", status: "الحالة", size: "الحجم",
  city: "المدينة", country: "الدولة", website: "الموقع", annual_revenue: "الإيرادات السنوية",
  owner_employee_id: "الموظف المسؤول", impact_percent: "نسبة التأثير %",
  outcome_summary: "ملخص النتائج", onboarded_at: "تاريخ بدء التعامل", notes: "ملاحظات",
};

const STAGE_LABELS: Record<string, string> = {
  new: "جديد", qualified: "مؤهل", proposal: "عرض", negotiation: "تفاوض", won: "فوز", lost: "خسارة",
};

export function HistoryButton({ entityType, entityId, title, variant = "icon" }: Props) {
  const [open, setOpen] = useState(false);
  const { employees } = useHR();

  const labels = entityType === "deal" ? DEAL_LABELS : entityType === "contact" ? CONTACT_LABELS : ACCOUNT_LABELS;

  const formatValue = (field: string, value: string | null): string => {
    if (!value) return "—";
    if (field === "owner_employee_id" || field === "account_id" || field === "contact_id") {
      const emp = employees.find(e => e.id === value);
      if (emp) return emp.fullName;
      return value.length > 8 ? value.slice(0, 8) + "…" : value;
    }
    if (field === "stage" && STAGE_LABELS[value]) return STAGE_LABELS[value];
    if (field.endsWith("_at") || field.endsWith("_date")) {
      try { return new Date(value).toLocaleDateString("ar-EG"); } catch { return value; }
    }
    if (value.length > 80) return value.slice(0, 80) + "…";
    return value;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button size="icon" variant="ghost" title="سجل التغييرات" className="h-8 w-8"><History size={15}/></Button>
        ) : (
          <Button size="sm" variant="outline" className="gap-1 font-cairo"><History size={14}/> السجل</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo flex items-center gap-2"><History size={18}/> سجل التغييرات — {title}</DialogTitle>
        </DialogHeader>
        <CrmHistoryTimeline
          entityType={entityType}
          entityId={entityId}
          fieldLabels={labels}
          formatValue={formatValue}
          maxHeight="60vh"
        />
      </DialogContent>
    </Dialog>
  );
}
