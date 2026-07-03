import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DEAL_STAGES, DEAL_PRIORITIES, type DealStage } from "@/types/crm";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GripVertical, Eye } from "lucide-react";
import { toast } from "sonner";

const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);

export default function PipelinePage() {
  const { deals, accounts, updateDealStage } = useCrm();
  const { employees } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const [dragId, setDragId] = useState<string | null>(null);
  const [overStage, setOverStage] = useState<DealStage | null>(null);

  const onDrop = async (stage: DealStage) => {
    if (isManager || !dragId) return;
    const d = deals.find(x => x.id === dragId);
    setDragId(null); setOverStage(null);
    if (!d || d.stage === stage) return;
    await updateDealStage(dragId, stage);
    toast.success(`تم نقل الصفقة إلى ${DEAL_STAGES.find(s => s.value === stage)?.label}`);
  };

  const ownerName = (id?: string | null) => employees.find(e => e.id === id)?.fullName || "—";

  return (
    <div className="space-y-5 font-cairo">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">Pipeline المبيعات</h1>
          <p className="text-muted-foreground mt-1">{isManager ? "عرض مراحل الصفقات (وضع المشاهدة فقط)" : "اسحب الصفقات بين المراحل لتحديث حالتها"}</p>
        </div>
        <div className="flex gap-2 items-center">
          {isManager && <Badge variant="outline" className="flex items-center gap-1 px-3 py-1.5"><Eye size={13}/> عرض فقط</Badge>}
          <Link to="/crm/deals"><Button variant="outline">عرض جدولي</Button></Link>
        </div>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-3" dir="rtl">
        {DEAL_STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.value);
          const total = stageDeals.reduce((s, d) => s + d.value, 0);
          const isOver = overStage === stage.value;
          return (
            <div
              key={stage.value}
              className={`shrink-0 w-72 rounded-xl border-2 transition-colors ${isOver ? "border-primary bg-primary/5" : "border-border bg-muted/30"}`}
              onDragOver={(e) => { e.preventDefault(); setOverStage(stage.value); }}
              onDragLeave={() => setOverStage(null)}
              onDrop={() => onDrop(stage.value)}
            >
              <div className="p-3 border-b border-border flex items-center justify-between">
                <div>
                  <Badge variant="outline" className={stage.color}>{stage.label}</Badge>
                  <p className="text-xs text-muted-foreground mt-1">{stageDeals.length} صفقة</p>
                </div>
                <p className="text-sm font-bold">{fmt(total)} ج.م</p>
              </div>
              <div className="p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-240px)] overflow-y-auto">
                {stageDeals.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">لا توجد صفقات</p>
                )}
                {stageDeals.map(d => {
                  const acc = accounts.find(a => a.id === d.accountId);
                  const pr = DEAL_PRIORITIES.find(p => p.value === d.priority)!;
                  return (
                    <Card
                      key={d.id}
                      draggable={!isManager}
                      onDragStart={() => !isManager && setDragId(d.id)}
                      onDragEnd={() => { setDragId(null); setOverStage(null); }}
                      className={`transition-all hover:shadow-md ${isManager ? "cursor-default" : "cursor-grab active:cursor-grabbing"} ${dragId === d.id ? "opacity-40" : ""}`}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          {!isManager && <GripVertical size={14} className="text-muted-foreground mt-0.5 shrink-0"/>}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{d.title}</p>
                            {acc && <p className="text-xs text-muted-foreground truncate mt-0.5">{acc.name}</p>}
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-bold text-sm">{fmt(d.value)} {d.currency}</p>
                          <Badge variant="outline" className={pr.color}>{pr.label}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{d.probability}% احتمالية</span>
                          {d.expectedCloseDate && <span>{new Date(d.expectedCloseDate).toLocaleDateString("ar-EG")}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground border-t pt-1">مسؤول: {ownerName(d.ownerEmployeeId)}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
