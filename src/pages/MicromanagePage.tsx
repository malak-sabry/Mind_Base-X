import { useEffect, useMemo, useState, useCallback } from "react";
import { useHR } from "@/contexts/HRContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, CheckCircle2, ListChecks, Eye, MessageCircle, MessagesSquare, Wifi } from "lucide-react";
import { ChatDialog } from "@/components/ChatDialog";
import { CrmNotesButton } from "@/components/CrmNotesButton";
import type { Task } from "@/types/hr";
import { toast } from "sonner";

type Stage = "not_started" | "in_progress" | "in_review" | "done";

const STAGES: { id: Stage; label: string; color: string; icon: any }[] = [
  { id: "not_started", label: "لم تبدأ", color: "bg-slate-500/15 text-slate-700 border-slate-500/30", icon: ListChecks },
  { id: "in_progress", label: "قيد التنفيذ", color: "bg-blue-500/15 text-blue-700 border-blue-500/30", icon: Clock },
  { id: "in_review", label: "قيد المراجعة", color: "bg-amber-500/15 text-amber-700 border-amber-500/30", icon: Eye },
  { id: "done", label: "تم الإنجاز", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30", icon: CheckCircle2 },
];

function defaultStage(t: Task): Stage {
  if (t.status === "done") return "done";
  if (t.status === "late") return "in_progress";
  const ageHours = (Date.now() - new Date(t.createdAt).getTime()) / 3_600_000;
  return ageHours < 24 ? "not_started" : "in_progress";
}

export default function MicromanagePage() {
  const { tasks, getEmployeeById } = useHR();
  const { user } = useAuth();
  const isManager = user?.role === "manager";

  const [stages, setStages] = useState<Record<string, Stage>>({});
  const [live, setLive] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [generalOpen, setGeneralOpen] = useState(false);
  const [chatTask, setChatTask] = useState<Task | null>(null);
  const [showMineOnly, setShowMineOnly] = useState(false);

  const loadStages = useCallback(async () => {
    const { data, error } = await supabase.from("task_stages").select("task_id, stage");
    if (error) return;
    const map: Record<string, Stage> = {};
    (data || []).forEach((r: any) => { map[r.task_id] = r.stage as Stage; });
    setStages(map);
  }, []);

  useEffect(() => {
    loadStages();
    (supabase as any).rpc("ensure_due_task_reminders");
    const ch = supabase.channel("task_stages-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "task_stages" }, (payload: any) => {
        setStages((prev) => {
          const next = { ...prev };
          if (payload.eventType === "DELETE") {
            delete next[payload.old.task_id];
          } else {
            const row = payload.new;
            next[row.task_id] = row.stage;
          }
          return next;
        });
      })
      .subscribe((status) => { setLive(status === "SUBSCRIBED"); });
    return () => { supabase.removeChannel(ch); };
  }, [loadStages]);

  const taskStage = (t: Task): Stage => stages[t.id] || defaultStage(t);
  const canEditTask = (t: Task) => {
    if (isManager) return true;
    const emp = getEmployeeById(t.assignedTo);
    return !!emp && emp.id === user?.employeeId;
  };

  const columns = useMemo(() => {
    const map: Record<Stage, Task[]> = { not_started: [], in_progress: [], in_review: [], done: [] };
    tasks
      .filter((t) => !showMineOnly || t.assignedTo === user?.employeeId)
      .forEach((t) => { map[taskStage(t)].push(t); });
    return map;
  }, [tasks, stages, showMineOnly, user?.employeeId]);

  const moveTo = async (taskId: string, stage: Stage) => {
    const t = tasks.find((x) => x.id === taskId);
    if (!t || !canEditTask(t)) { toast.error("لا يمكنك تحريك هذه المهمة"); return; }
    // optimistic
    setStages((p) => ({ ...p, [taskId]: stage }));
    const { error } = await supabase.from("task_stages").upsert({
      task_id: taskId, stage, updated_by: (await supabase.auth.getUser()).data.user?.id, updated_at: new Date().toISOString(),
    }, { onConflict: "task_id" });
    if (error) { toast.error("لا يمكنك تحريك هذه المهمة إلا لو كانت مخصصة لك أو كنت مديراً: " + error.message); loadStages(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground flex items-center gap-2">
            Micromanage — متابعة دقيقة
            {live && <Badge variant="outline" className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30 text-[10px] gap-1"><Wifi size={10} /> مباشر</Badge>}
          </h1>
          <p className="text-muted-foreground text-sm mt-1 font-cairo">
            تحريك المهام يتم لحظياً ويظهر فوراً لكل الفريق.
            {isManager && <span className="mr-2 text-amber-600">— يمكن للمدير تحريك أي مهمة</span>}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {!!user?.employeeId && (
            <Button
              variant={showMineOnly ? "default" : "outline"}
              onClick={() => setShowMineOnly((v) => !v)}
              className="gap-2 font-cairo"
            >
              <ListChecks size={17} /> {showMineOnly ? "إظهار كل المهام" : "إظهار مهامي فقط"}
            </Button>
          )}
          <Button onClick={() => setGeneralOpen(true)} className="gradient-primary text-primary-foreground gap-2 font-cairo">
            <MessagesSquare size={18} /> المحادثة العامة
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {STAGES.map((col) => {
          const Icon = col.icon;
          const items = columns[col.id];
          return (
            <div
              key={col.id}
              onDragOver={(e) => { e.preventDefault(); }}
              onDrop={() => { if (dragId) { moveTo(dragId, col.id); setDragId(null); } }}
              className="bg-muted/40 rounded-xl p-3 min-h-[400px] border border-border"
            >
              <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center gap-2">
                  <Icon size={18} className="text-foreground/70" />
                  <h3 className="font-cairo font-semibold text-sm">{col.label}</h3>
                </div>
                <Badge variant="outline" className={col.color}>{items.length}</Badge>
              </div>

              <div className="space-y-2">
                {items.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-6 font-cairo">لا توجد مهام</p>
                )}
                {items.map((t) => {
                  const emp = getEmployeeById(t.assignedTo);
                  const isLate = t.status === "late";
                  const deadline = new Date(t.deadline);
                  const editable = canEditTask(t);
                  return (
                    <Card
                      key={t.id}
                      draggable={editable}
                      onDragStart={() => editable && setDragId(t.id)}
                      className={`p-3 ${editable ? "cursor-grab" : "cursor-not-allowed opacity-80"} hover:shadow-md transition-shadow`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-cairo text-sm font-semibold leading-snug">{t.title}</h4>
                        {isLate && <AlertTriangle size={14} className="text-rose-500 shrink-0" />}
                      </div>
                      {t.description && (
                        <p className="text-xs text-muted-foreground font-cairo line-clamp-2 mb-2">{t.description}</p>
                      )}
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-cairo">
                        <span className="truncate">{emp?.fullName || "غير محدد"}</span>
                        <span>{deadline.toLocaleDateString("ar-EG")}</span>
                      </div>
                      <div className="mt-2 flex items-center justify-between gap-1">
                        <Badge variant="outline" className={
                          t.priority === "high" ? "bg-rose-500/15 text-rose-700 text-[10px]" :
                          t.priority === "medium" ? "bg-blue-500/15 text-blue-700 text-[10px]" :
                          "bg-muted text-muted-foreground text-[10px]"
                        }>
                          {t.priority === "high" ? "عالية" : t.priority === "medium" ? "متوسطة" : "منخفضة"}
                        </Badge>
                        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()} onMouseDown={(e) => e.stopPropagation()} draggable={false}>
                          <CrmNotesButton entityType="task" entityId={t.id} entityTitle={t.title} size="sm" label="ملاحظة" managerOnly />
                          <Button variant="ghost" size="sm" className="h-7 px-2 gap-1 text-[11px] font-cairo"
                            onClick={(e) => { e.stopPropagation(); setChatTask(t); }}
                            onMouseDown={(e) => e.stopPropagation()}
                            draggable={false}
                          >
                            <MessageCircle size={13} /> محادثة
                          </Button>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <ChatDialog open={generalOpen} onOpenChange={setGeneralOpen} scope="general" title="محادثة الفريق العامة" />
      <ChatDialog open={!!chatTask} onOpenChange={(v) => !v && setChatTask(null)} scope="task" taskId={chatTask?.id} title={chatTask ? `محادثة المهمة: ${chatTask.title}` : ""} />
    </div>
  );
}
