import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { History, Plus, Pencil, Trash2, ArrowLeft } from "lucide-react";

interface HistoryRow {
  id: string;
  entity_type: string;
  entity_id: string;
  action: "created" | "updated" | "deleted" | string;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  changed_by_name: string;
  changed_at: string;
}

interface Props {
  entityType: "account" | "deal" | "contact";
  entityId: string;
  /** map of internal field names to user-friendly Arabic labels */
  fieldLabels?: Record<string, string>;
  /** optional renderer to format values (e.g. owner_employee_id -> employee name) */
  formatValue?: (field: string, value: string | null) => string;
  maxHeight?: string;
}

const fmtDateTime = (d: string) => new Date(d).toLocaleString("ar-EG", {
  year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
});

export function CrmHistoryTimeline({ entityType, entityId, fieldLabels = {}, formatValue, maxHeight = "400px" }: Props) {
  const [rows, setRows] = useState<HistoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const { data } = await supabase
        .from("crm_history")
        .select("*")
        .eq("entity_type", entityType)
        .eq("entity_id", entityId)
        .order("changed_at", { ascending: false })
        .limit(200);
      if (!active) return;
      setRows((data || []) as HistoryRow[]);
      setLoading(false);
    };
    load();

    const ch = supabase
      .channel(`crm-history-${entityType}-${entityId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "crm_history", filter: `entity_id=eq.${entityId}` }, () => load())
      .subscribe();

    return () => { active = false; supabase.removeChannel(ch); };
  }, [entityType, entityId]);

  const renderVal = (field: string | null, v: string | null) => {
    if (!field || v === null || v === "") return "—";
    if (formatValue) return formatValue(field, v);
    return v;
  };

  const labelOf = (f: string | null) => (f && fieldLabels[f]) || f || "";

  if (loading) return <div className="text-sm text-muted-foreground font-cairo text-center py-4">جارٍ تحميل السجل…</div>;
  if (rows.length === 0) return <div className="text-sm text-muted-foreground font-cairo text-center py-6">لا توجد تغييرات مسجّلة بعد.</div>;

  return (
    <div className="space-y-2 overflow-y-auto pr-1" style={{ maxHeight }}>
      {rows.map(r => {
        const icon = r.action === "created" ? <Plus size={14} className="text-emerald-600"/> :
                     r.action === "deleted" ? <Trash2 size={14} className="text-rose-600"/> :
                     <Pencil size={14} className="text-blue-600"/>;
        const headline = r.action === "created" ? "تم الإنشاء" :
                         r.action === "deleted" ? "تم الحذف" :
                         `تغيير: ${labelOf(r.field_name)}`;
        return (
          <div key={r.id} className="flex gap-3 p-3 rounded-lg border border-border bg-card">
            <div className="mt-0.5">{icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-cairo font-semibold">{headline}</div>
                <div className="text-[11px] text-muted-foreground font-cairo">{fmtDateTime(r.changed_at)}</div>
              </div>
              {r.action === "updated" && (
                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs font-cairo">
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 line-through max-w-[40%] truncate">{renderVal(r.field_name, r.old_value)}</span>
                  <ArrowLeft size={12} className="text-muted-foreground"/>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 max-w-[40%] truncate">{renderVal(r.field_name, r.new_value)}</span>
                </div>
              )}
              <div className="text-[11px] text-muted-foreground font-cairo mt-1 flex items-center gap-1">
                <History size={11}/> بواسطة {r.changed_by_name}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
