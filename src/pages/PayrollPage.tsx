import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { Search, Wallet, TrendingDown, TrendingUp, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DEPARTMENTS } from "@/types/hr";

export default function PayrollPage() {
  const { employees, getAbsentDays, getPresentDays } = useHR();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));

  const activeEmployees = employees.filter((e) => e.status === "active");
  const filtered = activeEmployees.filter((e) => {
    const matchSearch = e.fullName.includes(search) || e.role.includes(search);
    const matchDept = !deptFilter || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const calcPayroll = (emp: typeof employees[0]) => {
    const absent = getAbsentDays(emp);
    const present = getPresentDays(emp);
    const totalDays = present + absent || 1;
    const dailyRate = emp.salary / 30;
    const deductions = absent * dailyRate;
    const overtime = 0; // placeholder
    const bonuses = 0;
    const netSalary = emp.salary - deductions + overtime + bonuses;
    const attendanceRate = Math.round((present / totalDays) * 100);
    return { dailyRate, deductions, overtime, bonuses, netSalary, attendanceRate, absent, present };
  };

  const totalGross = filtered.reduce((s, e) => s + e.salary, 0);
  const totalNet = filtered.reduce((s, e) => s + calcPayroll(e).netSalary, 0);
  const totalDeductions = filtered.reduce((s, e) => s + calcPayroll(e).deductions, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">المرتبات</h1>
        <p className="text-muted-foreground text-sm mt-1">كشوف المرتبات الشهرية مع الخصومات والاستحقاقات</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <label className="text-xs text-muted-foreground font-cairo block mb-2">الشهر</label>
          <Input type="month" value={month} onChange={(e) => setMonth(e.target.value)} />
        </div>
        <div className="stat-card text-center">
          <DollarSign className="text-primary mx-auto mb-1" size={22} />
          <p className="text-xl font-bold text-foreground font-cairo">{totalGross.toLocaleString("ar-EG")}</p>
          <p className="text-xs text-muted-foreground font-cairo">إجمالي الرواتب</p>
        </div>
        <div className="stat-card text-center">
          <TrendingDown className="text-destructive mx-auto mb-1" size={22} />
          <p className="text-xl font-bold text-destructive font-cairo">{Math.round(totalDeductions).toLocaleString("ar-EG")}</p>
          <p className="text-xs text-muted-foreground font-cairo">إجمالي الخصومات</p>
        </div>
        <div className="stat-card text-center">
          <Wallet className="text-success mx-auto mb-1" size={22} />
          <p className="text-xl font-bold text-success font-cairo">{Math.round(totalNet).toLocaleString("ar-EG")}</p>
          <p className="text-xs text-muted-foreground font-cairo">صافي المستحقات</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo"
        >
          <option value="">كل الأقسام</option>
          {DEPARTMENTS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* Payroll table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-sm font-bold font-cairo text-foreground">الموظف</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">القسم</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">الراتب الأساسي</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">أيام الحضور</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">أيام الغياب</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">الخصومات</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">نسبة الحضور</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">صافي الراتب</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const payroll = calcPayroll(emp);
                return (
                  <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">
                          {emp.fullName.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground font-cairo">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground font-cairo">
                      {DEPARTMENTS.find((d) => d.value === emp.department)?.label}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-foreground font-cairo">
                      {emp.salary.toLocaleString("ar-EG")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-success">{payroll.present}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${payroll.absent > 5 ? "text-destructive" : "text-warning"}`}>
                        {payroll.absent}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-destructive font-cairo">
                        -{Math.round(payroll.deductions).toLocaleString("ar-EG")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-16 bg-muted rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${payroll.attendanceRate >= 80 ? "bg-success" : payroll.attendanceRate >= 60 ? "bg-warning" : "bg-destructive"}`}
                            style={{ width: `${payroll.attendanceRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">{payroll.attendanceRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-bold text-success font-cairo">
                        {Math.round(payroll.netSalary).toLocaleString("ar-EG")}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-muted/50 border-t-2 border-border">
                <td colSpan={2} className="px-4 py-3 text-sm font-bold font-cairo text-foreground">الإجمالي</td>
                <td className="px-4 py-3 text-center text-sm font-bold font-cairo text-foreground">{totalGross.toLocaleString("ar-EG")}</td>
                <td colSpan={2}></td>
                <td className="px-4 py-3 text-center text-sm font-bold text-destructive font-cairo">-{Math.round(totalDeductions).toLocaleString("ar-EG")}</td>
                <td></td>
                <td className="px-4 py-3 text-center text-sm font-bold text-success font-cairo">{Math.round(totalNet).toLocaleString("ar-EG")}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-10 font-cairo">لا يوجد موظفين</p>}
      </div>
    </div>
  );
}
