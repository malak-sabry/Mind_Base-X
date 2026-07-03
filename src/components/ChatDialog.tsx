import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, Send } from "lucide-react";

interface ChatMessage {
  id: string;
  scope: string;
  task_id: string | null;
  sender_user_id: string | null;
  sender_employee_id: string | null;
  sender_name: string;
  sender_role: string;
  message: string;
  created_at: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  scope: "general" | "task";
  taskId?: string;
  title: string;
}

export function ChatDialog({ open, onOpenChange, scope, taskId, title }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    let q = supabase.from("chat_messages").select("*").eq("scope", scope).order("created_at", { ascending: true });
    if (scope === "task" && taskId) q = q.eq("task_id", taskId);
    const { data } = await q;
    setMessages((data || []) as ChatMessage[]);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
  };

  useEffect(() => {
    if (!open) return;
    fetchMessages();
    const ch = supabase.channel(`chat-${scope}-${taskId ?? "g"}`)
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages",
          filter: scope === "task" && taskId ? `task_id=eq.${taskId}` : `scope=eq.${scope}` },
        (payload) => {
          const m = payload.new as ChatMessage;
          if (scope === "general" && m.scope !== "general") return;
          if (scope === "task" && m.task_id !== taskId) return;
          setMessages((prev) => [...prev, m]);
          setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
        })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, scope, taskId]);

  const send = async () => {
    const m = text.trim();
    if (!m || !user) return;
    setText("");
    await supabase.from("chat_messages").insert({
      scope, task_id: scope === "task" ? taskId : null,
      sender_user_id: user.id, sender_employee_id: user.employeeId ?? null,
      sender_name: user.name, sender_role: user.role, message: m,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden" dir="rtl">
        <DialogHeader className="px-4 pt-4">
          <DialogTitle className="font-cairo flex items-center gap-2"><MessageCircle size={18} /> {title}</DialogTitle>
        </DialogHeader>
        <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 space-y-2 bg-muted/30">
          {messages.length === 0 && <p className="text-center text-xs text-muted-foreground font-cairo py-8">لا توجد رسائل — ابدأ المحادثة</p>}
          {messages.map((m) => {
            const mine = m.sender_user_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm font-cairo ${mine ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}>
                  <div className="text-[10px] opacity-70 mb-0.5">{m.sender_name} • {m.sender_role === "manager" ? "مدير" : "موظف"}</div>
                  <div className="whitespace-pre-wrap">{m.message}</div>
                  <div className="text-[9px] opacity-60 mt-1 text-left">{new Date(m.created_at).toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 border-t border-border bg-background flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} placeholder="اكتب رسالة..." className="font-cairo" />
          <Button onClick={send} className="gradient-primary text-primary-foreground"><Send size={16} /></Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
