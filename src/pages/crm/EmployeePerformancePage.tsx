import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Phone, Users as UsersIcon, AlertTriangle, TrendingUp, Award, Search, Activity, Briefcase, CheckCircle2 } from "lucide-react";
import { useCrm } from "@/contexts/CrmContext";
import { useHR } from "@/contexts/HRContext";
import { DEAL_STAGES } from "@/types/crm";

const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(Math.round(n));

interface EmpStats {
  id: string;
  name: string;
  role: string;
  department: string;
  accounts: number;
  contacts: number;
  totalDeals: number;
  activeDeals: number;
  wonDeals: number;
  lostDeals: number;
  winRate: number;
  pipelineValue: number;
  wonValue: number;
  totalActivities: number;
  completedActivities: number;
  overdueActivities: number;
  responseRate: number;
  professionalismScore: number;
  rating: { label: string; color: string };
}

const rateProfessionalism = (winRate: number, responseRate: number, overdueRatio: number) => {
  // 0..100 composite
  const score = Math.max(
    0,
    Math.round(0.45 * winRate + 0.4 * responseRate + 0.15 * (100 - overdueRatio * 100))
  );
  return score;
};

const ratingOf = (score: number, totalDeals: number, totalActivities: number) => {
  if (totalDeals === 0 && totalActivities === 0)
    return { label: "بدون نشاط", color: "bg-muted text-muted-foreground border-border" };
  if (score >= 80) return { label: "ممتاز", color: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" };
  if (score >= 60) return { label: "جيد جداً", color: "bg-blue-500/15 text-blue-600 border-blue-500/30" };
  if (score >= 40) return { label: "جيد", color: "bg-amber-500/15 text-amber-600 border-amber-500/30" };
  return { label: "يحتاج تحسين", color: "bg-rose-500/15 text-rose-600 border-rose-500/30" };
};

export default function EmployeePerformancePage() {
  const { accounts, contacts, deals, activities } = useCrm();
  const { employees } = useHR();
  const [q, setQ] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "won" | "deals" | "activities">("score");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const stats: EmpStats[] = useMemo(() => {
    return employees.map((e) => {
      const empAccounts = accounts.filter((a) => a.ownerEmployeeId === e.id);
      const empContacts = contacts.filter((c) => c.ownerEmployeeId === e.id);
      const empDeals = deals.filter((d) => d.ownerEmployeeId === e.id);
      const empActs = activities.filter((a) => a.ownerEmployeeId === e.id);

      const wonDeals = empDeals.filter((d) => d.stage === "won").length;
      const lostDeals = empDeals.filter((d) => d.stage === "lost").length;
      const activeDeals = empDeals.filter((d) => d.stage !== "won" && d.stage !== "lost").length;
      const closed = wonDeals + lostDeals;
      const winRate = closed > 0 ? Math.round((wonDeals / closed) * 100) : 0;

      const pipelineValue = empDeals
        .filter((d) => d.stage !== "won" && d.stage !== "lost")
        .reduce((s, d) => s + d.value, 0);
      const wonValue = empDeals.filter((d) => d.stage === "won").reduce((s, d) => s + d.value, 0);

      const completed = empActs.filter((a) => a.status === "completed").length;
      const overdue = empActs.filter(
        (a) => a.status === "pending" && a.scheduledAt && new Date(a.scheduledAt) < new Date()
      ).length;
      const totalActs = empActs.length;
      const responseRate = totalActs > 0 ? Math.round((completed / totalActs) * 100) : 0;
      const overdueRatio = totalActs > 0 ? overdue / totalActs : 0;
      const profScore = rateProfessionalism(winRate, responseRate, overdueRatio);

      return {
        id: e.id,
        name: e.fullName,
        role: e.role,
        department: e.department,
        accounts: empAccounts.length,
        contacts: empContacts.length,
        totalDeals: empDeals.length,
        activeDeals,
        wonDeals,
        lostDeals,
        winRate,
        pipelineValue,
        wonValue,
        totalActivities: totalActs,
        completedActivities: completed,
        overdueActivities: overdue,
        responseRate,
        professionalismScore: profScore,
        rating: ratingOf(profScore, empDeals.length, totalActs),
      };
    });
  }, [employees, accounts, contacts, deals, activities]);

  const filtered = useMemo(() => {
    const list = stats.filter((s) => !q || s.name.toLowerCase().includes(q.toLowerCase()));
    return list.sort((a, b) => {
      if (sortBy === "score") return b.professionalismScore - a.professionalismScore;
      if (sortBy === "won") return b.wonValue - a.wonValue;
      if (sortBy === "deals") return b.totalDeals - a.totalDeals;
      return b.totalActivities - a.totalActivities;
    });
  }, [stats, q, sortBy]);

  const selected = filtered.find((s) => s.id === selectedId) || filtered[0];
  const empDeals = selected ? deals.filter((d) => d.ownerEmployeeId === selected.id) : [];
  const empActs = selected ? activities.filter((a) => a.ownerEmployeeId === selected.id) : [];

  return (
    <div className="space-y-5 font-cairo">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Award /> أداء الفريق مع العملاء
        </h1>
        <p className="text-muted-foreground mt-1">
          تابع علاقة كل موظف بالعملاء، نسبة الإغلاق، الالتزام بالمواعيد، ومدى احترافيته
        </p>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
            <Input placeholder="ابحث باسم الموظف..." value={q} onChange={(e) => setQ(e.target.value)} className="pr-10" />
          </div>
          <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
            <SelectTrigger className="w-56"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="score">ترتيب: درجة الاحترافية</SelectItem>
              <SelectItem value="won">ترتيب: قيمة الصفقات المكسوبة</SelectItem>
              <SelectItem value="deals">ترتيب: عدد الصفقات</SelectItem>
              <SelectItem value="activities">ترتيب: عدد الأنشطة</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">ملخص الأداء لكل موظف</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الموظف</TableHead>
                <TableHead className="text-right">العملاء</TableHead>
                <TableHead className="text-right">الصفقات</TableHead>
                <TableHead className="text-right">نسبة الإغلاق</TableHead>
                <TableHead className="text-right">قيمة الفوز</TableHead>
                <TableHead className="text-right">Pipeline</TableHead>
                <TableHead className="text-right">الأنشطة</TableHead>
                <TableHead className="text-right">متأخرة</TableHead>
                <TableHead className="text-right">درجة الاحترافية</TableHead>
                <TableHead className="text-right">التقييم</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-12 text-muted-foreground">لا يوجد موظفون</TableCell></TableRow>
              ) : filtered.map((s) => (
                <TableRow key={s.id} onClick={() => setSelectedId(s.id)} className="cursor-pointer hover:bg-muted/40">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                        {s.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.role || s.department}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{s.contacts}</TableCell>
                  <TableCell>
                    <span className="font-medium">{s.totalDeals}</span>
                    <span className="text-xs text-muted-foreground"> ({s.activeDeals} نشط)</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: `${s.winRate}%` }} />
                      </div>
                      <span className="text-xs font-medium">{s.winRate}%</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-emerald-600">{fmt(s.wonValue)} ج.م</TableCell>
                  <TableCell className="text-sm">{fmt(s.pipelineValue)} ج.م</TableCell>
                  <TableCell>
                    <span className="font-medium">{s.totalActivities}</span>
                    <span className="text-xs text-muted-foreground"> ({s.completedActivities} ✓)</span>
                  </TableCell>
                  <TableCell>
                    {s.overdueActivities > 0 ? (
                      <span className="flex items-center gap-1 text-rose-600 font-bold">
                        <AlertTriangle size={13} /> {s.overdueActivities}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-14 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full ${
                            s.professionalismScore >= 80 ? "bg-emerald-500"
                              : s.professionalismScore >= 60 ? "bg-blue-500"
                              : s.professionalismScore >= 40 ? "bg-amber-500" : "bg-rose-500"
                          }`}
                          style={{ width: `${s.professionalismScore}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold">{s.professionalismScore}</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="outline" className={s.rating.color}>{s.rating.label}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {selected && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Trophy size={18} /> تفاصيل أداء: {selected.name}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              نظرة عميقة على العلاقات والصفقات والمتابعات
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><UsersIcon size={12}/> عملاء يديرهم</p>
                <p className="text-2xl font-bold mt-1">{selected.contacts}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Briefcase size={12}/> صفقات نشطة</p>
                <p className="text-2xl font-bold mt-1">{selected.activeDeals}</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><CheckCircle2 size={12}/> نسبة الإنجاز</p>
                <p className="text-2xl font-bold mt-1">{selected.responseRate}%</p>
              </div>
              <div className="p-3 rounded-lg border">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp size={12}/> قيمة الفوز</p>
                <p className="text-lg font-bold mt-1 text-emerald-600">{fmt(selected.wonValue)} ج.م</p>
              </div>
            </div>

            <Tabs defaultValue="deals">
              <TabsList>
                <TabsTrigger value="deals">الصفقات ({empDeals.length})</TabsTrigger>
                <TabsTrigger value="activities">آخر المتابعات ({empActs.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="deals" className="mt-3">
                {empDeals.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد صفقات مسجلة لهذا الموظف</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">الصفقة</TableHead>
                        <TableHead className="text-right">العميل</TableHead>
                        <TableHead className="text-right">القيمة</TableHead>
                        <TableHead className="text-right">المرحلة</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {empDeals.slice(0, 10).map((d) => {
                        const st = DEAL_STAGES.find((s) => s.value === d.stage)!;
                        const acc = accounts.find((a) => a.id === d.accountId);
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.title}</TableCell>
                            <TableCell className="text-sm">{acc?.name || "—"}</TableCell>
                            <TableCell className="font-bold">{fmt(d.value)} {d.currency}</TableCell>
                            <TableCell><Badge variant="outline" className={st.color}>{st.label}</Badge></TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
              <TabsContent value="activities" className="mt-3">
                {empActs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">لا توجد متابعات مسجلة</p>
                ) : (
                  <div className="space-y-2">
                    {empActs.slice(0, 10).map((a) => {
                      const c = contacts.find((c) => c.id === a.contactId);
                      const overdue = a.status === "pending" && a.scheduledAt && new Date(a.scheduledAt) < new Date();
                      return (
                        <div key={a.id} className={`p-3 rounded-lg border flex items-center justify-between ${overdue ? "border-rose-500/40 bg-rose-500/5" : ""}`}>
                          <div className="flex items-center gap-2 min-w-0">
                            <Activity size={14} className="text-muted-foreground shrink-0" />
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate">{a.title}</p>
                              <p className="text-xs text-muted-foreground truncate">{c?.fullName || "—"}</p>
                            </div>
                          </div>
                          <div className="text-left text-xs shrink-0">
                            <p className={overdue ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                              {a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString("ar-EG") : "—"}
                            </p>
                            <p className="text-muted-foreground">{a.status === "completed" ? "مكتمل" : a.status === "pending" ? "قيد الانتظار" : "ملغي"}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
