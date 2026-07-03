import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { CalendarCheck, CalendarX, Clock, Search, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DEPARTMENTS } from "@/types/hr";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export default function AttendancePage() {
  const { employees, markAttendance, getAbsentDays, getPresentDays, hasExcessiveAbsence } = useHR();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [showHistory, setShowHistory] = useState<string | null>(null);

  const activeEmployees = employees.filter((e) => e.status === "active");
  const filtered = activeEmployees.filter((e) => {
    const matchSearch = e.fullName.includes(search) || e.role.includes(search);
    const matchDept = !deptFilter || e.department === deptFilter;
    return matchSearch && matchDept;
  });

  const getAttendanceForDate = (empId: string, date: string) => {
    const emp = employees.find((e) => e.id === empId);
    return emp?.attendance.find((a) => a.date === date);
  };

  const handleMarkAttendance = async (empId: string, present: boolean) => {
    await markAttendance(empId, selectedDate, present);
  };

  const todayStats = {
    present: filtered.filter((e) => getAttendanceForDate(e.id, selectedDate)?.present === true).length,
    absent: filtered.filter((e) => getAttendanceForDate(e.id, selectedDate)?.present === false).length,
    unmarked: filtered.filter((e) => !getAttendanceForDate(e.id, selectedDate)).length,
  };

  const historyEmp = showHistory ? employees.find((e) => e.id === showHistory) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">الحضور والانصراف</h1>
        <p className="text-muted-foreground text-sm mt-1">تسجيل ومتابعة حضور وغياب الموظفين يومياً</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="stat-card">
          <label className="text-xs text-muted-foreground font-cairo block mb-2">اختر التاريخ</label>
          <Input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        </div>
        <div className="stat-card text-center">
          <CalendarCheck className="text-success mx-auto mb-1" size={22} />
          <p className="text-2xl font-bold text-success">{todayStats.present}</p>
          <p className="text-xs text-muted-foreground font-cairo">حاضر</p>
        </div>
        <div className="stat-card text-center">
          <CalendarX className="text-destructive mx-auto mb-1" size={22} />
          <p className="text-2xl font-bold text-destructive">{todayStats.absent}</p>
          <p className="text-xs text-muted-foreground font-cairo">غائب</p>
        </div>
        <div className="stat-card text-center">
          <Clock className="text-warning mx-auto mb-1" size={22} />
          <p className="text-2xl font-bold text-warning">{todayStats.unmarked}</p>
          <p className="text-xs text-muted-foreground font-cairo">لم يُسجل</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="بحث بالاسم..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>
        <select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo">
          <option value="">كل الأقسام</option>
          {DEPARTMENTS.map((d) => (<option key={d.value} value={d.value}>{d.label}</option>))}
        </select>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-sm font-bold font-cairo text-foreground">الموظف</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">القسم</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">إجمالي الحضور</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">إجمالي الغياب</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">حالة اليوم</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">إجراء</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">السجل</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((emp) => {
                const todayRecord = getAttendanceForDate(emp.id, selectedDate);
                const present = getPresentDays(emp);
                const absent = getAbsentDays(emp);
                const excessive = hasExcessiveAbsence(emp);
                return (
                  <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center text-primary-foreground text-sm font-bold shrink-0">{emp.fullName.charAt(0)}</div>
                        <div>
                          <p className="text-sm font-medium text-foreground font-cairo">{emp.fullName}</p>
                          <p className="text-xs text-muted-foreground">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground font-cairo">{DEPARTMENTS.find((d) => d.value === emp.department)?.label}</td>
                    <td className="px-4 py-3 text-center"><span className="text-sm font-bold text-success">{present}</span></td>
                    <td className="px-4 py-3 text-center"><span className={`text-sm font-bold ${excessive ? "text-destructive" : "text-warning"}`}>{absent}{excessive && " ⚠️"}</span></td>
                    <td className="px-4 py-3 text-center">
                      {todayRecord ? (
                        <span className={todayRecord.present ? "badge-success" : "badge-destructive"}>{todayRecord.present ? "حاضر" : "غائب"}</span>
                      ) : (
                        <span className="badge-warning">لم يُسجل</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Button size="sm" variant={todayRecord?.present === true ? "default" : "outline"} className="h-8 w-8 p-0" onClick={() => handleMarkAttendance(emp.id, true)} title="تسجيل حضور"><Check size={14} /></Button>
                        <Button size="sm" variant={todayRecord?.present === false ? "destructive" : "outline"} className="h-8 w-8 p-0" onClick={() => handleMarkAttendance(emp.id, false)} title="تسجيل غياب"><X size={14} /></Button>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Button size="sm" variant="ghost" className="text-xs font-cairo" onClick={() => setShowHistory(emp.id)}>عرض السجل</Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-10 font-cairo">لا يوجد موظفين</p>}
      </div>

      <Dialog open={!!showHistory} onOpenChange={() => setShowHistory(null)}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-cairo">سجل الحضور - {historyEmp?.fullName}</DialogTitle>
          </DialogHeader>
          {historyEmp && (
            <div className="space-y-2 mt-2">
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="bg-success/10 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-success">{getPresentDays(historyEmp)}</p>
                  <p className="text-xs text-muted-foreground font-cairo">أيام حضور</p>
                </div>
                <div className="bg-destructive/10 rounded-lg p-3 text-center">
                  <p className="text-xl font-bold text-destructive">{getAbsentDays(historyEmp)}</p>
                  <p className="text-xs text-muted-foreground font-cairo">أيام غياب</p>
                </div>
              </div>
              {[...historyEmp.attendance].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map((record) => (
                <div key={record.date} className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                  <span className="text-sm text-foreground">{new Date(record.date).toLocaleDateString("ar-EG", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</span>
                  <span className={record.present ? "badge-success" : "badge-destructive"}>{record.present ? "حاضر" : "غائب"}</span>
                </div>
              ))}
              {historyEmp.attendance.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">لا يوجد سجلات</p>}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
