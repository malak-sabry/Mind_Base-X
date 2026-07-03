import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Package, TrendingUp, Calendar, Pencil } from "lucide-react";
import { toast } from "sonner";

interface MachineLite { id: string; name: string; responsible_employee_id: string | null; }

interface SparePart {
  id: string; machine_id: string; name: string; part_number: string;
  cost: number; quantity: number; life_months: number; supplier: string;
  installed_at: string | null; notes: string;
}
interface ProductionLog {
  id: string; machine_id: string; log_date: string; units_produced: number;
  hours_operated: number; downtime_hours: number; notes: string;
}

const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(Math.round(n));

export function MachineDetailsDialog({
  open, onOpenChange, machine,
}: { open: boolean; onOpenChange: (v: boolean) => void; machine: MachineLite | null; }) {
  const { user } = useAuth();
  const isManager = user?.role === "manager";
  const canEdit = !!machine && (isManager || (!!user?.employeeId && machine.responsible_employee_id === user.employeeId));

  const [parts, setParts] = useState<SparePart[]>([]);
  const [logs, setLogs] = useState<ProductionLog[]>([]);

  const emptyPart = useMemo(() => ({
    machine_id: machine?.id || "", name: "", part_number: "", cost: 0,
    quantity: 1, life_months: 6, supplier: "", installed_at: new Date().toISOString().slice(0, 10), notes: "",
  }), [machine?.id]);
  const emptyLog = useMemo(() => ({
    machine_id: machine?.id || "", log_date: new Date().toISOString().slice(0, 10),
    units_produced: 0, hours_operated: 0, downtime_hours: 0, notes: "",
  }), [machine?.id]);

  const [partForm, setPartForm] = useState<any>(emptyPart);
  const [logForm, setLogForm] = useState<any>(emptyLog);
  const [editingPart, setEditingPart] = useState<string | null>(null);

  useEffect(() => { setPartForm(emptyPart); setLogForm(emptyLog); setEditingPart(null); }, [emptyPart, emptyLog]);

  const load = async () => {
    if (!machine) return;
    const [p, l] = await Promise.all([
      supabase.from("erp_spare_parts").select("*").eq("machine_id", machine.id).order("created_at", { ascending: false }),
      supabase.from("erp_production_logs").select("*").eq("machine_id", machine.id).order("log_date", { ascending: false }),
    ]);
    if (p.data) setParts(p.data as SparePart[]);
    if (l.data) setLogs(l.data as ProductionLog[]);
  };

  useEffect(() => {
    if (!open || !machine) return;
    load();
    const ch = supabase.channel(`machine-${machine.id}-rt`)
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_spare_parts", filter: `machine_id=eq.${machine.id}` }, load)
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_production_logs", filter: `machine_id=eq.${machine.id}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [open, machine?.id]);

  const submitPart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine || !partForm.name.trim()) return;
    const payload = { ...partForm, machine_id: machine.id };
    if (editingPart) {
      const { id, ...rest } = payload;
      const { error } = await supabase.from("erp_spare_parts").update(rest).eq("id", editingPart);
      if (error) return toast.error(error.message);
      toast.success("تم تحديث قطعة الغيار");
    } else {
      const { error } = await supabase.from("erp_spare_parts").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("تم إضافة قطعة الغيار");
    }
    setPartForm(emptyPart); setEditingPart(null);
  };
  const deletePart = async (id: string) => {
    if (!confirm("حذف القطعة؟")) return;
    const { error } = await supabase.from("erp_spare_parts").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم الحذف");
  };
  const startEditPart = (p: SparePart) => { setPartForm(p); setEditingPart(p.id); };

  const submitLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!machine) return;
    const u = (await supabase.auth.getUser()).data.user;
    const { error } = await supabase.from("erp_production_logs").insert({ ...logForm, machine_id: machine.id, created_by: u?.id });
    if (error) return toast.error(error.message);
    toast.success("تم تسجيل الإنتاج");
    setLogForm(emptyLog);
  };
  const deleteLog = async (id: string) => {
    if (!confirm("حذف هذا السجل؟")) return;
    const { error } = await supabase.from("erp_production_logs").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("تم الحذف");
  };

  const stats = useMemo(() => {
    const now = new Date(); const thisYear = now.getFullYear(); const thisMonth = now.getMonth(); const today = now.toISOString().slice(0, 10);
    const daily = logs.filter(l => l.log_date === today);
    const monthly = logs.filter(l => { const d = new Date(l.log_date); return d.getFullYear() === thisYear && d.getMonth() === thisMonth; });
    const yearly = logs.filter(l => new Date(l.log_date).getFullYear() === thisYear);
    const sum = (arr: ProductionLog[], k: "units_produced" | "hours_operated" | "downtime_hours") => arr.reduce((s, x) => s + Number(x[k] || 0), 0);
    return {
      daily: { units: sum(daily, "units_produced"), hours: sum(daily, "hours_operated"), down: sum(daily, "downtime_hours") },
      monthly: { units: sum(monthly, "units_produced"), hours: sum(monthly, "hours_operated"), down: sum(monthly, "downtime_hours") },
      yearly: { units: sum(yearly, "units_produced"), hours: sum(yearly, "hours_operated"), down: sum(yearly, "downtime_hours") },
      totalParts: parts.reduce((s, p) => s + Number(p.cost || 0) * Number(p.quantity || 0), 0),
    };
  }, [logs, parts]);

  if (!machine) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="font-cairo">تفاصيل الآلة: {machine.name}</DialogTitle>
          <DialogDescription className="font-cairo">قطع الغيار وسجل الإنتاج اليومي والشهري والسنوي</DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="production" dir="rtl">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="production" className="font-cairo gap-2"><TrendingUp size={14} /> الإنتاج</TabsTrigger>
            <TabsTrigger value="parts" className="font-cairo gap-2"><Package size={14} /> قطع الغيار</TabsTrigger>
          </TabsList>

          <TabsContent value="production" className="space-y-4 mt-4">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "اليوم", data: stats.daily, color: "text-blue-600" },
                { label: "هذا الشهر", data: stats.monthly, color: "text-violet-600" },
                { label: "هذه السنة", data: stats.yearly, color: "text-emerald-600" },
              ].map((s) => (
                <Card key={s.label} className="p-3">
                  <div className={`text-xs font-cairo ${s.color} flex items-center gap-1`}><Calendar size={12} /> {s.label}</div>
                  <div className="text-2xl font-bold mt-1">{fmt(s.data.units)}</div>
                  <div className="text-[10px] text-muted-foreground font-cairo">وحدة • {fmt(s.data.hours)} س تشغيل • {fmt(s.data.down)} س توقف</div>
                </Card>
              ))}
            </div>

            {canEdit && (
              <Card className="p-4">
                <h4 className="font-cairo font-semibold mb-3 text-sm">تسجيل إنتاج جديد</h4>
                <form onSubmit={submitLog} className="grid grid-cols-2 md:grid-cols-5 gap-3 items-end">
                  <div><Label className="font-cairo text-xs">التاريخ</Label><Input type="date" value={logForm.log_date} onChange={(e) => setLogForm({ ...logForm, log_date: e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">وحدات منتجة</Label><Input type="number" value={logForm.units_produced} onChange={(e) => setLogForm({ ...logForm, units_produced: +e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">ساعات تشغيل</Label><Input type="number" step="0.5" value={logForm.hours_operated} onChange={(e) => setLogForm({ ...logForm, hours_operated: +e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">ساعات توقف</Label><Input type="number" step="0.5" value={logForm.downtime_hours} onChange={(e) => setLogForm({ ...logForm, downtime_hours: +e.target.value })} /></div>
                  <Button type="submit" className="gradient-primary text-primary-foreground font-cairo gap-1"><Plus size={14} /> تسجيل</Button>
                  <div className="col-span-full"><Label className="font-cairo text-xs">ملاحظات</Label><Input value={logForm.notes} onChange={(e) => setLogForm({ ...logForm, notes: e.target.value })} /></div>
                </form>
              </Card>
            )}

            <Card className="p-4">
              <h4 className="font-cairo font-semibold mb-3 text-sm">سجل الإنتاج</h4>
              {logs.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground font-cairo py-6">لا توجد سجلات</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-right text-xs text-muted-foreground border-b border-border">
                      <th className="py-2 font-cairo">التاريخ</th><th className="font-cairo">الوحدات</th><th className="font-cairo">تشغيل</th><th className="font-cairo">توقف</th><th className="font-cairo">ملاحظات</th><th></th>
                    </tr></thead>
                    <tbody>
                      {logs.map(l => (
                        <tr key={l.id} className="border-b border-border/50">
                          <td className="py-2 text-xs">{new Date(l.log_date).toLocaleDateString("ar-EG")}</td>
                          <td className="font-cairo">{fmt(Number(l.units_produced))}</td>
                          <td>{fmt(Number(l.hours_operated))}</td>
                          <td>{fmt(Number(l.downtime_hours))}</td>
                          <td className="text-xs font-cairo text-muted-foreground">{l.notes || "—"}</td>
                          <td>{canEdit && <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => deleteLog(l.id)}><Trash2 size={13} /></Button>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="parts" className="space-y-4 mt-4">
            <Card className="p-3 bg-muted/30">
              <div className="text-xs font-cairo text-muted-foreground">إجمالي قيمة المخزون من قطع الغيار</div>
              <div className="text-xl font-bold">{fmt(stats.totalParts)} <span className="text-xs font-normal">ج.م</span></div>
            </Card>

            {canEdit && (
              <Card className="p-4">
                <h4 className="font-cairo font-semibold mb-3 text-sm">{editingPart ? "تعديل قطعة غيار" : "إضافة قطعة غيار"}</h4>
                <form onSubmit={submitPart} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div><Label className="font-cairo text-xs">اسم القطعة *</Label><Input value={partForm.name} onChange={(e) => setPartForm({ ...partForm, name: e.target.value })} required /></div>
                  <div><Label className="font-cairo text-xs">رقم القطعة</Label><Input value={partForm.part_number} onChange={(e) => setPartForm({ ...partForm, part_number: e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">التكلفة (ج.م)</Label><Input type="number" value={partForm.cost} onChange={(e) => setPartForm({ ...partForm, cost: +e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">الكمية</Label><Input type="number" value={partForm.quantity} onChange={(e) => setPartForm({ ...partForm, quantity: +e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">العمر (أشهر)</Label><Input type="number" value={partForm.life_months} onChange={(e) => setPartForm({ ...partForm, life_months: +e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">المورّد</Label><Input value={partForm.supplier} onChange={(e) => setPartForm({ ...partForm, supplier: e.target.value })} /></div>
                  <div><Label className="font-cairo text-xs">تاريخ التركيب</Label><Input type="date" value={partForm.installed_at || ""} onChange={(e) => setPartForm({ ...partForm, installed_at: e.target.value })} /></div>
                  <div className="md:col-span-2"><Label className="font-cairo text-xs">ملاحظات</Label><Input value={partForm.notes} onChange={(e) => setPartForm({ ...partForm, notes: e.target.value })} /></div>
                  <div className="md:col-span-2 flex justify-end gap-2">
                    {editingPart && <Button type="button" variant="outline" onClick={() => { setPartForm(emptyPart); setEditingPart(null); }} className="font-cairo">إلغاء</Button>}
                    <Button type="submit" className="gradient-primary text-primary-foreground font-cairo gap-1"><Plus size={14} /> {editingPart ? "تحديث" : "حفظ"}</Button>
                  </div>
                </form>
              </Card>
            )}

            <Card className="p-4">
              <h4 className="font-cairo font-semibold mb-3 text-sm">قطع الغيار المسجّلة ({parts.length})</h4>
              {parts.length === 0 ? (
                <p className="text-center text-xs text-muted-foreground font-cairo py-6">لا توجد قطع غيار</p>
              ) : (
                <div className="space-y-2">
                  {parts.map(p => {
                    const lifeEnd = p.installed_at ? new Date(p.installed_at) : null;
                    if (lifeEnd) lifeEnd.setMonth(lifeEnd.getMonth() + Number(p.life_months || 0));
                    const expired = lifeEnd && lifeEnd < new Date();
                    return (
                      <div key={p.id} className="flex items-start justify-between border border-border rounded-lg p-3 hover:bg-muted/30">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-cairo font-semibold">{p.name}</span>
                            {p.part_number && <Badge variant="outline" className="text-[10px]">#{p.part_number}</Badge>}
                            {expired && <Badge className="bg-rose-500/15 text-rose-700 text-[10px] border-rose-500/30" variant="outline">انتهى العمر</Badge>}
                          </div>
                          <div className="text-xs text-muted-foreground font-cairo mt-1">
                            الكمية: {p.quantity} • التكلفة: {fmt(Number(p.cost))} ج.م • العمر: {p.life_months} شهر
                            {p.supplier && ` • المورّد: ${p.supplier}`}
                            {p.installed_at && ` • مُركّبة: ${new Date(p.installed_at).toLocaleDateString("ar-EG")}`}
                          </div>
                          {p.notes && <div className="text-xs text-muted-foreground font-cairo mt-1 italic">{p.notes}</div>}
                        </div>
                        {canEdit && (
                          <div className="flex gap-1 shrink-0">
                            <Button variant="ghost" size="sm" onClick={() => startEditPart(p)}><Pencil size={13} /></Button>
                            <Button variant="ghost" size="sm" className="text-rose-600" onClick={() => deletePart(p.id)}><Trash2 size={13} /></Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
