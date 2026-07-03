import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MessageCircleWarning, StickyNote, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface CrmNote {
  id: string;
  entity_type: string;
  entity_id: string;
  author_user_id: string | null;
  author_name: string;
  author_role: string;
  note: string;
  created_at: string;
}

interface Props {
  entityType: "deal" | "account" | "contact" | "activity" | "task" | "erp_machine";
  entityId: string;
  entityTitle?: string;
  label?: string;
  size?: "icon" | "sm";
  managerOnly?: boolean;
}

export function CrmNotesButton({ entityType, entityId, entityTitle, label, size = "icon", managerOnly = false }: Props) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notes, setNotes] = useState<CrmNote[]>([]);
  const [text, setText] = useState("");
  const [count, setCount] = useState(0);

  const fetchCount = async () => {
    const { count: c } = await supabase.from("crm_notes").select("*", { count: "exact", head: true })
      .eq("entity_type", entityType).eq("entity_id", entityId);
    setCount(c ?? 0);
  };

  const fetchNotes = async () => {
    const { data } = await supabase.from("crm_notes").select("*")
      .eq("entity_type", entityType).eq("entity_id", entityId)
      .order("created_at", { ascending: false });
    setNotes((data || []) as CrmNote[]);
  };

  useEffect(() => { fetchCount(); }, [entityType, entityId]);
  useEffect(() => { if (open) fetchNotes(); }, [open]);

  const add = async () => {
    const m = text.trim();
    if (!m || !user) return;
    if (managerOnly && user.role !== "manager") {
      toast.error("إضافة الملاحظات هنا للمدير فقط");
      return;
    }
    const { error } = await supabase.from("crm_notes").insert({
      entity_type: entityType, entity_id: entityId,
      author_user_id: user.id, author_name: user.name, author_role: user.role, note: m,
    });
    if (error) { toast.error(error.message); return; }
    setText("");
    fetchNotes(); fetchCount();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("crm_notes").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    fetchNotes(); fetchCount();
  };

  return (
    <>
      <Button size={size === "icon" ? "icon" : "sm"} variant="ghost" title="ملاحظات" onClick={() => setOpen(true)} className="relative gap-1 font-cairo">
        <StickyNote size={15} />
        {size === "sm" && <span>{label || "ملاحظة"}</span>}
        {count > 0 && <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[9px] rounded-full w-4 h-4 flex items-center justify-center">{count}</span>}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader><DialogTitle className="font-cairo flex items-center gap-2"><StickyNote size={18} /> ملاحظات{entityTitle ? ` — ${entityTitle}` : ""}</DialogTitle></DialogHeader>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {notes.length === 0 && <p className="text-xs text-muted-foreground text-center py-6 font-cairo">لا توجد ملاحظات بعد</p>}
            {notes.map((n) => (
              <div key={n.id} className="p-3 rounded-lg bg-muted/40 border border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-cairo">{n.author_name} • {n.author_role === "manager" ? "مدير" : "موظف"} • {new Date(n.created_at).toLocaleString("ar-EG")}</p>
                    <p className="text-sm font-cairo mt-1 whitespace-pre-wrap">{n.note}</p>
                  </div>
                  {(n.author_user_id === user?.id || user?.role === "manager") && (
                    <Button variant="ghost" size="icon" onClick={() => del(n.id)}><Trash2 size={13} className="text-rose-600" /></Button>
                  )}
                </div>
              </div>
            ))}
          </div>
          {(!managerOnly || user?.role === "manager") ? (
            <div className="flex gap-2 border-t border-border pt-3">
              <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب ملاحظة..." rows={2} className="font-cairo" />
              <Button onClick={add} className="gradient-primary text-primary-foreground font-cairo">إضافة</Button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-t border-border pt-3 text-xs text-muted-foreground font-cairo">
              <MessageCircleWarning size={14} /> ملاحظات المدير تظهر هنا للمتابعة فقط.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
