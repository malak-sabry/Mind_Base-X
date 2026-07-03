import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCrm } from "@/contexts/CrmContext";
import { Building2, Users, Briefcase, TrendingUp, Trophy, AlertCircle, Calendar, DollarSign } from "lucide-react";
import { DEAL_STAGES } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const fmt = (n: number) => new Intl.NumberFormat("ar-EG").format(Math.round(n));

export default function CrmDashboard() {
  const { stats, deals, activities, accounts, contacts, loading } = useCrm();

  const stageCounts = DEAL_STAGES.map(s => ({
    ...s,
    count: deals.filter(d => d.stage === s.value).length,
    value: deals.filter(d => d.stage === s.value).reduce((sum, d) => sum + d.value, 0),
  }));

  const topDeals = [...deals]
    .filter(d => d.stage !== "won" && d.stage !== "lost")
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const upcomingActivities = [...activities]
    .filter(a => a.status === "pending" && a.scheduledAt)
    .sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime())
    .slice(0, 6);

  const kpis = [
    { label: "إجمالي الشركات", value: stats.accounts, icon: Building2, color: "from-blue-500 to-blue-600" },
    { label: "جهات الاتصال", value: stats.contacts, icon: Users, color: "from-violet-500 to-violet-600" },
    { label: "صفقات نشطة", value: stats.activeDeals, icon: Briefcase, color: "from-amber-500 to-amber-600" },
    { label: "نسبة الفوز", value: `${stats.winRate}%`, icon: Trophy, color: "from-emerald-500 to-emerald-600" },
  ];

  

  return (
    <div className="space-y-6 font-cairo">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-bold">لوحة تحكم CRM</h1>
          <p className="text-muted-foreground mt-1">نظرة شاملة على المبيعات وعلاقات العملاء</p>
        </div>
        <div className="flex gap-2">
          <Link to="/crm/pipeline"><Button variant="outline">عرض Pipeline</Button></Link>
          <Link to="/crm/deals"><Button>إدارة الصفقات</Button></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => (
          <Card key={i} className="overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${k.color} flex items-center justify-center text-white shrink-0`}>
                <k.icon size={22} />
              </div>
              <div>
                <p className="text-2xl font-bold">{k.value}</p>
                <p className="text-xs text-muted-foreground">{k.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><DollarSign size={18}/> قيمة الـ Pipeline</CardTitle>
            <div className="text-left">
              <p className="text-2xl font-bold">{fmt(stats.pipelineValue)} ج.م</p>
              <p className="text-xs text-muted-foreground">مرجّح: {fmt(stats.weightedPipeline)} ج.م</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {stageCounts.map(s => {
              const max = Math.max(...stageCounts.map(x => x.value), 1);
              const pct = (s.value / max) * 100;
              return (
                <div key={s.value}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="font-medium">{s.label} <span className="text-muted-foreground">({s.count})</span></span>
                    <span className="text-muted-foreground">{fmt(s.value)} ج.م</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><AlertCircle size={18}/> ملخص سريع</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">صفقات تم الفوز بها</span><span className="font-bold text-emerald-600">{stats.wonDeals}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">صفقات خاسرة</span><span className="font-bold text-rose-600">{stats.lostDeals}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">قيمة الفوز</span><span className="font-bold">{fmt(stats.wonValue)} ج.م</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">أنشطة قيد الانتظار</span><span className="font-bold">{stats.pendingActivities}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">أنشطة متأخرة</span><span className="font-bold text-rose-600">{stats.overdueActivities}</span></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><TrendingUp size={18}/> أكبر الصفقات النشطة</CardTitle></CardHeader>
          <CardContent>
            {topDeals.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">لا توجد صفقات</p> : (
              <div className="space-y-2">
                {topDeals.map(d => {
                  const stage = DEAL_STAGES.find(s => s.value === d.stage)!;
                  const acc = accounts.find(a => a.id === d.accountId);
                  return (
                    <div key={d.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/40 transition">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{d.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{acc?.name || "—"}</p>
                      </div>
                      <div className="text-left shrink-0">
                        <p className="font-bold text-sm">{fmt(d.value)} {d.currency}</p>
                        <Badge variant="outline" className={stage.color}>{stage.label}</Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Calendar size={18}/> الأنشطة القادمة</CardTitle></CardHeader>
          <CardContent>
            {upcomingActivities.length === 0 ? <p className="text-sm text-muted-foreground text-center py-6">لا توجد أنشطة مجدولة</p> : (
              <div className="space-y-2">
                {upcomingActivities.map(a => {
                  const c = contacts.find(c => c.id === a.contactId);
                  const overdue = a.scheduledAt && new Date(a.scheduledAt) < new Date();
                  return (
                    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{a.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{c?.fullName || a.description || "—"}</p>
                      </div>
                      <div className="text-left text-xs shrink-0">
                        <p className={overdue ? "text-rose-600 font-bold" : "text-muted-foreground"}>
                          {a.scheduledAt ? new Date(a.scheduledAt).toLocaleDateString("ar-EG") : ""}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
