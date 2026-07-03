import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { Search, Check, X, Clock, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEPARTMENTS, LEAVE_TYPES } from "@/types/hr";
import { Textarea } from "@/components/ui/textarea";

export default function LeaveRequestsPage() {
  const { leaveRequests, employees, updateLeaveRequest, getEmployeeById } = useHR();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedReq, setSelectedReq] = useState<string | null>(null);
  const [managerNote, setManagerNote] = useState("");

  const filtered = leaveRequests.filter((r) => {
    const emp = getEmployeeById(r.employeeId);
    const matchSearch = emp?.fullName.includes(search) || r.reason.includes(search);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const detail = selectedReq ? leaveRequests.find(r => r.id === selectedReq) : null;
  const detailEmp = detail ? getEmployeeById(detail.employeeId) : null;

  const handleAction = async (status: "approved" | "rejected") => {
    if (!selectedReq) return;
    await updateLeaveRequest(selectedReq, status, managerNote);
    setSelectedReq(null);
    setManagerNote("");
  };

  const statusLabel = (s: string) => s === "pending" ? "قيد المراجعة" : s === "approved" ? "تمت الموافقة" : "مرفوض";
  const statusBadge = (s: string) => s === "pending" ? "badge-warning" : s === "approved" ? "badge-success" : "badge-destructive";
  const leaveTypeLabel = (v: string) => LEAVE_TYPES.find(t => t.value === v)?.label || v;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">طلبات الإجازات</h1>
        <p className="text-muted-foreground text-sm mt-1">{leaveRequests.length} طلب إجازة</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input placeholder="بحث بالاسم أو السبب..." value={search} onChange={(e) => setSearch(e.target.value)} className="pr-10 font-cairo" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo">
          <option value="">كل الحالات</option>
          <option value="pending">قيد المراجعة</option>
          <option value="approved">تمت الموافقة</option>
          <option value="rejected">مرفوض</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map((req) => {
          const emp = getEmployeeById(req.employeeId);
          return (
            <div key={req.id} className="stat-card cursor-pointer" onClick={() => { setSelectedReq(req.id); setManagerNote(""); }}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-sm shrink-0">
                  {emp?.fullName.charAt(0) || "؟"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-foreground font-cairo">{emp?.fullName || "غير معروف"}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {leaveTypeLabel(req.leaveType)} • من {new Date(req.startDate).toLocaleDateString("ar-EG")} إلى {new Date(req.endDate).toLocaleDateString("ar-EG")}
                  </p>
                  <p className="text-xs text-muted-foreground">{req.reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={statusBadge(req.status)}>{statusLabel(req.status)}</span>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-10 font-cairo">لا توجد طلبات إجازات</p>}
      </div>

      <Dialog open={!!selectedReq} onOpenChange={() => setSelectedReq(null)}>
        <DialogContent className="max-w-lg">
          {detail && detailEmp && (
            <>
              <DialogHeader>
                <DialogTitle className="font-cairo">تفاصيل طلب الإجازة</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center text-primary-foreground font-bold text-lg">{detailEmp.fullName.charAt(0)}</div>
                  <div>
                    <p className="font-bold font-cairo text-foreground">{detailEmp.fullName}</p>
                    <p className="text-xs text-muted-foreground">{detailEmp.role} - {DEPARTMENTS.find(d => d.value === detailEmp.department)?.label}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground font-cairo">نوع الإجازة</p><p className="text-sm text-foreground">{leaveTypeLabel(detail.leaveType)}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">الحالة</p><span className={statusBadge(detail.status)}>{statusLabel(detail.status)}</span></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">من</p><p className="text-sm text-foreground">{new Date(detail.startDate).toLocaleDateString("ar-EG")}</p></div>
                  <div><p className="text-xs text-muted-foreground font-cairo">إلى</p><p className="text-sm text-foreground">{new Date(detail.endDate).toLocaleDateString("ar-EG")}</p></div>
                </div>
                <div><p className="text-xs text-muted-foreground font-cairo">السبب</p><p className="text-sm text-foreground mt-1">{detail.reason}</p></div>
                {detail.managerNote && <div><p className="text-xs text-muted-foreground font-cairo">ملاحظة المدير</p><p className="text-sm text-foreground mt-1">{detail.managerNote}</p></div>}

                {detail.status === "pending" && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">ملاحظة المدير (اختياري)</label>
                      <Textarea value={managerNote} onChange={(e) => setManagerNote(e.target.value)} className="font-cairo" placeholder="أضف ملاحظة..." />
                    </div>
                    <div className="flex gap-3">
                      <Button onClick={() => handleAction("approved")} className="flex-1 bg-success text-success-foreground font-cairo gap-1"><Check size={16} /> موافقة</Button>
                      <Button onClick={() => handleAction("rejected")} variant="destructive" className="flex-1 font-cairo gap-1"><X size={16} /> رفض</Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
