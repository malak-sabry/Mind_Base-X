import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useHR } from "@/contexts/HRContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Factory, Wrench, DollarSign, AlertTriangle, Package, TrendingUp, Pencil, Eye } from "lucide-react";
import { toast } from "sonner";
import { MachineDetailsDialog } from "@/components/MachineDetailsDialog";

interface Machine {
  id: string;
  name: string;
  serial_number: string;
  purchase_date: string;
  cost: number;
  expected_life_years: number;
  warranty_months: number;
  hourly_output: number;
  spare_part_name: string;
  spare_part_cost: number;
  spare_part_life_months: number;
  status: "operational" | "maintenance" | "down";
  responsible_employee_id: string | null;
  notes: string;
}

const empty: Omit<Machine, "id"> = {
  name: "", serial_number: "", purchase_date: new Date().toISOString().slice(0, 10),
  cost: 0, expected_life_years: 10, warranty_months: 12, hourly_output: 0,
  spare_part_name: "", spare_part_cost: 0, spare_part_life_months: 6,
  status: "operational", responsible_employee_id: null, notes: "",
};

const STATUS_META: Record<Machine["status"], { label: string; color: string }> = {
  operational: { label: "تعمل", color: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" },
  maintenance: { label: "صيانة", color: "bg-amber-500/15 text-amber-700 border-amber-500/30" },
  down: { label: "متوقفة", color: "bg-rose-500/15 text-rose-700 border-rose-500/30" },
};

export default function ErpSystemPage() {
  const { user } = useAuth();
  const { employees } = useHR();
  const isManager = user?.role === "manager";

  const [machines, setMachines] = useState<Machine[]>([]);
  const [detailsMachine, setDetailsMachine] = useState<Machine | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Machine | (Omit<Machine, "id"> & { id?: string })>({ ...empty });

  const fetchMachines = async () => {
    const { data, error } = await supabase.from("erp_machines").select("*").order("created_at", { ascending: false });
    if (error) { toast.error("فشل تحميل الآلات: " + error.message); return; }
    setMachines((data || []) as Machine[]);
  };

  useEffect(() => {
    fetchMachines();
    const ch = supabase.channel("erp-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "erp_machines" }, fetchMachines)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const canEditMachine = (m: Machine) =>
    isManager || (!!user?.employeeId && m.responsible_employee_id === user.employeeId);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    const payload = { ...form } as any;
    delete payload.id;
    if (form.id) {
      const { error } = await supabase.from("erp_machines").update(payload).eq("id", form.id);
      if (error) { toast.error(error.message); return; }
      toast.success("تم تحديث الآلة");
    } else {
      const { error } = await supabase.from("erp_machines").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success("تم إضافة الآلة");
    }
    setForm({ ...empty });
    setShowForm(false);
  };

  const startEdit = (m: Machine) => { setForm({ ...m }); setShowForm(true); };
  const removeMachine = async (id: string) => {
    if (!confirm("حذف هذه الآلة؟")) return;
    const { error } = await supabase.from("erp_machines").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
  };

  const stats = useMemo(() => {
    const totalInvestment = machines.reduce((s, m) => s + Number(m.cost || 0), 0);
    const operational = machines.filter((m) => m.status === "operational").length;
    const needsMaintenance = machines.filter((m) => {
      const purchase = new Date(m.purchase_date);
      const warrantyEnd = new Date(purchase); warrantyEnd.setMonth(warrantyEnd.getMonth() + Number(m.warranty_months || 0));
      return warrantyEnd < new Date() || m.status === "maintenance";
    }).length;
    const totalHourlyOutput = machines.reduce((s, m) => s + Number(m.hourly_output || 0), 0);
    return { totalInvestment, operational, needsMaintenance, totalHourlyOutput, count: machines.length };
  }, [machines]);

  const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(n);
  const empName = (id: string | null) => employees.find(e => e.id === id)?.fullName || "—";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">ERP System — تخطيط موارد المؤسسة</h1>
          <p className="text-muted-foreground text-sm mt-1 font-cairo">
            المدير والموظف المسؤول عن الآلة يمكنهما الإضافة والتعديل. التعديلات تظهر فوراً للجميع.
          </p>
        </div>
        <Button onClick={() => { setForm({ ...empty }); setShowForm(true); }} className="gradient-primary text-primary-foreground gap-2">
          <Plus size={18} /><span className="font-cairo">إضافة آلة</span>
        </Button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="p-4"><div className="flex items-center gap-2 text-blue-600"><Factory size={18} /><span className="text-xs font-cairo">عدد الآلات</span></div><div className="text-2xl font-bold mt-2">{stats.count}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-emerald-600"><TrendingUp size={18} /><span className="text-xs font-cairo">تعمل حالياً</span></div><div className="text-2xl font-bold mt-2">{stats.operational}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-amber-600"><Wrench size={18} /><span className="text-xs font-cairo">تحتاج صيانة</span></div><div className="text-2xl font-bold mt-2">{stats.needsMaintenance}</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-violet-600"><DollarSign size={18} /><span className="text-xs font-cairo">إجمالي الاستثمار</span></div><div className="text-2xl font-bold mt-2">{fmt(stats.totalInvestment)}<span className="text-xs font-normal mr-1">ج.م</span></div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-rose-600"><Package size={18} /><span className="text-xs font-cairo">إنتاج/ساعة</span></div><div className="text-2xl font-bold mt-2">{fmt(stats.totalHourlyOutput)}</div></Card>
      </div>

      <Card className="p-5">
        <h2 className="text-lg font-bold font-cairo mb-4">سجل الآلات والمعدات</h2>
        {machines.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground font-cairo">
            <Factory className="mx-auto mb-2 opacity-50" size={40} />
            لا توجد آلات مسجّلة بعد
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-muted-foreground border-b border-border">
                  <th className="py-2 px-2 font-cairo">الآلة</th>
                  <th className="py-2 px-2 font-cairo">المسؤول</th>
                  <th className="py-2 px-2 font-cairo">تاريخ الشراء</th>
                  <th className="py-2 px-2 font-cairo">التكلفة</th>
                  <th className="py-2 px-2 font-cairo">إنتاج/س</th>
                  <th className="py-2 px-2 font-cairo">قطعة الغيار</th>
                  <th className="py-2 px-2 font-cairo">الحالة</th>
                  <th className="py-2 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {machines.map((m) => {
                  const purchase = new Date(m.purchase_date);
                  const warrantyEnd = new Date(purchase); warrantyEnd.setMonth(warrantyEnd.getMonth() + Number(m.warranty_months || 0));
                  const warrantyExpired = warrantyEnd < new Date();
                  const editable = canEditMachine(m);
                  return (
                    <tr key={m.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-2 font-cairo font-medium">{m.name}<div className="text-[10px] text-muted-foreground">{m.serial_number || "—"}</div></td>
                      <td className="py-3 px-2 text-xs font-cairo">{empName(m.responsible_employee_id)}</td>
                      <td className="py-3 px-2 text-xs">{purchase.toLocaleDateString("ar-EG")}{warrantyExpired && <AlertTriangle className="inline mr-1 text-amber-500" size={12} />}</td>
                      <td className="py-3 px-2 font-cairo">{fmt(Number(m.cost))} ج.م</td>
                      <td className="py-3 px-2">{fmt(Number(m.hourly_output))}</td>
                      <td className="py-3 px-2 text-xs font-cairo">{m.spare_part_name ? `${m.spare_part_name} — ${fmt(Number(m.spare_part_cost))} ج.م` : "—"}</td>
                      <td className="py-3 px-2"><Badge variant="outline" className={STATUS_META[m.status].color + " font-cairo"}>{STATUS_META[m.status].label}</Badge></td>
                      <td className="py-3 px-2">
                        <div className="flex gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setDetailsMachine(m)} title="تفاصيل وقطع غيار وإنتاج"><Eye size={14} /></Button>
                          {editable && <Button variant="ghost" size="sm" onClick={() => startEdit(m)}><Pencil size={14} /></Button>}
                          {isManager && <Button variant="ghost" size="sm" onClick={() => removeMachine(m.id)} className="text-rose-600 hover:text-rose-700"><Trash2 size={14} /></Button>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
          <DialogHeader><DialogTitle className="font-cairo">{(form as any).id ? "تعديل آلة" : "إضافة آلة جديدة"}</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><Label className="font-cairo">اسم الآلة *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
              <div><Label className="font-cairo">الرقم التسلسلي</Label><Input value={form.serial_number} onChange={(e) => setForm({ ...form, serial_number: e.target.value })} /></div>
              <div><Label className="font-cairo">الموظف المسؤول</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-cairo" value={form.responsible_employee_id ?? ""} onChange={(e) => setForm({ ...form, responsible_employee_id: e.target.value || null })}>
                  <option value="">— لا يوجد —</option>
                  {employees.map(emp => (<option key={emp.id} value={emp.id}>{emp.fullName}</option>))}
                </select>
              </div>
              <div><Label className="font-cairo">الحالة</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm font-cairo" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as any })}>
                  <option value="operational">تعمل</option><option value="maintenance">صيانة</option><option value="down">متوقفة</option>
                </select>
              </div>
              <div><Label className="font-cairo">تاريخ الشراء</Label><Input type="date" value={form.purchase_date} onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} /></div>
              <div><Label className="font-cairo">التكلفة (ج.م)</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: +e.target.value })} /></div>
              <div><Label className="font-cairo">العمر الافتراضي (سنوات)</Label><Input type="number" value={form.expected_life_years} onChange={(e) => setForm({ ...form, expected_life_years: +e.target.value })} /></div>
              <div><Label className="font-cairo">الضمان (أشهر)</Label><Input type="number" value={form.warranty_months} onChange={(e) => setForm({ ...form, warranty_months: +e.target.value })} /></div>
              <div><Label className="font-cairo">الإنتاج/ساعة</Label><Input type="number" value={form.hourly_output} onChange={(e) => setForm({ ...form, hourly_output: +e.target.value })} /></div>
              <div><Label className="font-cairo">اسم قطعة الغيار</Label><Input value={form.spare_part_name} onChange={(e) => setForm({ ...form, spare_part_name: e.target.value })} /></div>
              <div><Label className="font-cairo">تكلفة قطعة الغيار</Label><Input type="number" value={form.spare_part_cost} onChange={(e) => setForm({ ...form, spare_part_cost: +e.target.value })} /></div>
              <div><Label className="font-cairo">عمر القطعة (أشهر)</Label><Input type="number" value={form.spare_part_life_months} onChange={(e) => setForm({ ...form, spare_part_life_months: +e.target.value })} /></div>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setShowForm(false)} className="font-cairo">إلغاء</Button>
              <Button type="submit" className="gradient-primary text-primary-foreground font-cairo">حفظ</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <MachineDetailsDialog
        open={!!detailsMachine}
        onOpenChange={(v) => !v && setDetailsMachine(null)}
        machine={detailsMachine}
      />
    </div>
  );
}
