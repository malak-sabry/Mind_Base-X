import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { FileText, Download, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/types/hr";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";

type ReportPeriod = "weekly" | "monthly" | "yearly";

export default function ReportsPage() {
  const { employees, tasks, leaveRequests, getAbsentDays, getPresentDays } = useHR();
  const [period, setPeriod] = useState<ReportPeriod>("monthly");
  const [exporting, setExporting] = useState(false);
  const activeEmps = employees.filter(e => e.status === "active");

  const totalSalaries = activeEmps.reduce((s, e) => s + e.salary, 0);
  const totalAbsent = activeEmps.reduce((s, e) => s + getAbsentDays(e), 0);
  const totalPresent = activeEmps.reduce((s, e) => s + getPresentDays(e), 0);
  const completedTasks = tasks.filter(t => t.status === "done").length;
  const lateTasks = tasks.filter(t => t.status === "late").length;
  const pendingTasks = tasks.filter(t => t.status === "pending").length;
  const approvedLeaves = leaveRequests.filter(r => r.status === "approved").length;
  const pendingLeaves = leaveRequests.filter(r => r.status === "pending").length;

  const deptStats = DEPARTMENTS.map(d => {
    const deptEmps = activeEmps.filter(e => e.department === d.value);
    const deptTasks = tasks.filter(t => deptEmps.some(e => e.id === t.assignedTo));
    return {
      dept: d.label,
      employees: deptEmps.length,
      totalSalary: deptEmps.reduce((s, e) => s + e.salary, 0),
      tasks: deptTasks.length,
      completedTasks: deptTasks.filter(t => t.status === "done").length,
      avgAttendance: deptEmps.length > 0 ? Math.round(deptEmps.reduce((s, e) => {
        const p = getPresentDays(e); const a = getAbsentDays(e);
        return s + (p + a > 0 ? (p / (p + a)) * 100 : 0);
      }, 0) / deptEmps.length) : 0,
    };
  }).filter(d => d.employees > 0);

  const periodLabel = period === "weekly" ? "أسبوعي" : period === "monthly" ? "شهري" : "سنوي";

  const getReportData = () => {
    return {
      summary: {
        "إجمالي الموظفين النشطين": activeEmps.length,
        "إجمالي الرواتب": `${totalSalaries.toLocaleString("ar-EG")} ج.م`,
        "إجمالي أيام الحضور": totalPresent,
        "إجمالي أيام الغياب": totalAbsent,
        "نسبة الحضور العامة": `${totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0}%`,
        "إجمالي المهام": tasks.length,
        "مهام مكتملة": completedTasks,
        "مهام متأخرة": lateTasks,
        "مهام قيد التنفيذ": pendingTasks,
        "نسبة الإنجاز": `${tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%`,
        "طلبات إجازة معتمدة": approvedLeaves,
        "طلبات إجازة معلقة": pendingLeaves,
      },
      employees: activeEmps.map(e => {
        const absent = getAbsentDays(e);
        const present = getPresentDays(e);
        const dailyRate = e.salary / 30;
        return {
          "الاسم": e.fullName,
          "القسم": DEPARTMENTS.find(d => d.value === e.department)?.label || e.department,
          "الوظيفة": e.role,
          "الراتب الأساسي": e.salary,
          "أيام الحضور": present,
          "أيام الغياب": absent,
          "نسبة الحضور": `${present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0}%`,
          "الخصومات": Math.round(absent * dailyRate),
          "صافي الراتب": Math.round(e.salary - absent * dailyRate),
        };
      }),
      departments: deptStats,
    };
  };

  const buildReportHTML = () => {
    const esc = (s: any) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const today = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });

    const tableStyle = `border-collapse:collapse;width:100%;margin-bottom:24px;`;
    const thStyle = `background:#1e40af;color:#fff;padding:10px 14px;text-align:right;font-size:13px;font-weight:bold;border:1px solid #1e40af;`;
    const tdStyle = `padding:8px 14px;text-align:right;font-size:12px;border:1px solid #ddd;`;
    const altRow = `background:#f0f5ff;`;
    const sectionTitle = `font-size:18px;font-weight:bold;color:#1e40af;margin:20px 0 10px;border-bottom:2px solid #1e40af;padding-bottom:6px;`;

    const empDetails = activeEmps.map((e, i) => {
      const absent = getAbsentDays(e);
      const present = getPresentDays(e);
      const dailyRate = e.salary / 30;
      const deductions = Math.round(absent * dailyRate);
      const net = Math.round(e.salary - deductions);
      const dept = DEPARTMENTS.find(d => d.value === e.department)?.label || e.department;
      const bg = i % 2 === 1 ? altRow : "";
      return `<tr style="${bg}">
        <td style="${tdStyle}font-weight:bold;">${esc(e.fullName)}</td>
        <td style="${tdStyle}">${esc(dept)}</td>
        <td style="${tdStyle}">${esc(e.role)}</td>
        <td style="${tdStyle}">${e.salary.toLocaleString("ar-EG")} ج.م</td>
        <td style="${tdStyle}color:#16a34a;font-weight:bold;">${present}</td>
        <td style="${tdStyle}color:#dc2626;font-weight:bold;">${absent}</td>
        <td style="${tdStyle}">${present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0}%</td>
        <td style="${tdStyle}color:#dc2626;">-${deductions.toLocaleString("ar-EG")} ج.م</td>
        <td style="${tdStyle}color:#16a34a;font-weight:bold;">${net.toLocaleString("ar-EG")} ج.م</td>
      </tr>`;
    }).join("");

    const deptRows = deptStats.map((d, i) => {
      const bg = i % 2 === 1 ? altRow : "";
      return `<tr style="${bg}">
        <td style="${tdStyle}font-weight:bold;">${esc(d.dept)}</td>
        <td style="${tdStyle}">${d.employees}</td>
        <td style="${tdStyle}">${d.totalSalary.toLocaleString("ar-EG")} ج.م</td>
        <td style="${tdStyle}">${d.tasks}</td>
        <td style="${tdStyle}color:#16a34a;font-weight:bold;">${d.completedTasks}</td>
        <td style="${tdStyle}">${d.avgAttendance}%</td>
      </tr>`;
    }).join("");

    const taskRows = tasks.map((t, i) => {
      const emp = employees.find(e => e.id === t.assignedTo);
      const statusText = t.status === "done" ? "مكتملة" : t.status === "late" ? "متأخرة" : "قيد التنفيذ";
      const statusColor = t.status === "done" ? "#16a34a" : t.status === "late" ? "#dc2626" : "#ea580c";
      const priorityText = t.priority === "high" ? "عالية" : t.priority === "medium" ? "متوسطة" : "منخفضة";
      const bg = i % 2 === 1 ? altRow : "";
      return `<tr style="${bg}">
        <td style="${tdStyle}font-weight:bold;">${esc(t.title)}</td>
        <td style="${tdStyle}">${esc(emp?.fullName || "-")}</td>
        <td style="${tdStyle}">${priorityText}</td>
        <td style="${tdStyle}color:${statusColor};font-weight:bold;">${statusText}</td>
        <td style="${tdStyle}">${new Date(t.deadline).toLocaleDateString("ar-EG")}</td>
        <td style="${tdStyle}">${t.completedAt ? new Date(t.completedAt).toLocaleDateString("ar-EG") : "-"}</td>
      </tr>`;
    }).join("");

    const leaveRowsHtml = leaveRequests.length > 0 ? leaveRequests.map((r, i) => {
      const emp = employees.find(e => e.id === r.employeeId);
      const typeText = r.leaveType === "annual" ? "سنوية" : r.leaveType === "sick" ? "مرضية" : r.leaveType === "emergency" ? "طارئة" : "بدون راتب";
      const statusText = r.status === "approved" ? "معتمدة" : r.status === "rejected" ? "مرفوضة" : "معلقة";
      const statusColor = r.status === "approved" ? "#16a34a" : r.status === "rejected" ? "#dc2626" : "#ea580c";
      const bg = i % 2 === 1 ? altRow : "";
      return `<tr style="${bg}">
        <td style="${tdStyle}font-weight:bold;">${esc(emp?.fullName || "-")}</td>
        <td style="${tdStyle}">${typeText}</td>
        <td style="${tdStyle}">${new Date(r.startDate).toLocaleDateString("ar-EG")}</td>
        <td style="${tdStyle}">${new Date(r.endDate).toLocaleDateString("ar-EG")}</td>
        <td style="${tdStyle}color:${statusColor};font-weight:bold;">${statusText}</td>
        <td style="${tdStyle}">${esc(r.reason || "-")}</td>
      </tr>`;
    }).join("") : `<tr><td colspan="6" style="${tdStyle}text-align:center;color:#888;">لا توجد طلبات إجازة</td></tr>`;

    const attendanceRate = totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const greenTh = thStyle.replace(/#1e40af/g, "#16a34a");
    const purpleTh = thStyle.replace(/#1e40af/g, "#7c3aed");
    const orangeTh = thStyle.replace(/#1e40af/g, "#ea580c");
    const cyanTh = thStyle.replace(/#1e40af/g, "#0891b2");

    return `
      <div style="font-family:'Cairo','Segoe UI',Tahoma,sans-serif;direction:rtl;padding:30px;background:#fff;color:#222;max-width:1100px;">
        <!-- Header -->
        <div style="background:linear-gradient(135deg,#1e40af,#7c3aed);padding:24px 30px;border-radius:12px;margin-bottom:24px;text-align:center;">
          <h1 style="color:#fff;font-size:26px;margin:0;">Mind_Base X</h1>
          <p style="color:#e0e7ff;font-size:14px;margin:6px 0 0;">تقرير ${periodLabel} شامل - ${today}</p>
        </div>

        <!-- Summary Cards -->
        <div style="${sectionTitle}">١. ملخص الشركة</div>
        <table style="${tableStyle}">
          <thead><tr>
            <th style="${thStyle}">البيان</th>
            <th style="${thStyle}">القيمة</th>
          </tr></thead>
          <tbody>
            <tr><td style="${tdStyle}font-weight:bold;">إجمالي الموظفين النشطين</td><td style="${tdStyle}">${activeEmps.length} موظف</td></tr>
            <tr style="${altRow}"><td style="${tdStyle}font-weight:bold;">إجمالي الرواتب</td><td style="${tdStyle}">${totalSalaries.toLocaleString("ar-EG")} ج.م</td></tr>
            <tr><td style="${tdStyle}font-weight:bold;">إجمالي أيام الحضور</td><td style="${tdStyle}color:#16a34a;font-weight:bold;">${totalPresent} يوم</td></tr>
            <tr style="${altRow}"><td style="${tdStyle}font-weight:bold;">إجمالي أيام الغياب</td><td style="${tdStyle}color:#dc2626;font-weight:bold;">${totalAbsent} يوم</td></tr>
            <tr><td style="${tdStyle}font-weight:bold;">نسبة الحضور العامة</td><td style="${tdStyle}">${attendanceRate}%</td></tr>
            <tr style="${altRow}"><td style="${tdStyle}font-weight:bold;">إجمالي المهام</td><td style="${tdStyle}">${tasks.length} مهمة</td></tr>
            <tr><td style="${tdStyle}font-weight:bold;">المهام المكتملة</td><td style="${tdStyle}color:#16a34a;">${completedTasks} مهمة</td></tr>
            <tr style="${altRow}"><td style="${tdStyle}font-weight:bold;">المهام المتأخرة</td><td style="${tdStyle}color:#dc2626;">${lateTasks} مهمة</td></tr>
            <tr><td style="${tdStyle}font-weight:bold;">المهام قيد التنفيذ</td><td style="${tdStyle}color:#ea580c;">${pendingTasks} مهمة</td></tr>
            <tr style="${altRow}"><td style="${tdStyle}font-weight:bold;">نسبة إنجاز المهام</td><td style="${tdStyle}">${taskCompletionRate}%</td></tr>
            <tr><td style="${tdStyle}font-weight:bold;">طلبات الإجازة المعتمدة</td><td style="${tdStyle}color:#16a34a;">${approvedLeaves} طلب</td></tr>
            <tr style="${altRow}"><td style="${tdStyle}font-weight:bold;">طلبات الإجازة المعلقة</td><td style="${tdStyle}color:#ea580c;">${pendingLeaves} طلب</td></tr>
          </tbody>
        </table>

        <!-- Department Performance -->
        <div style="${sectionTitle.replace(/#1e40af/g, "#16a34a")}">٢. أداء الأقسام</div>
        <table style="${tableStyle}">
          <thead><tr>
            <th style="${greenTh}">القسم</th>
            <th style="${greenTh}">عدد الموظفين</th>
            <th style="${greenTh}">إجمالي الرواتب</th>
            <th style="${greenTh}">عدد المهام</th>
            <th style="${greenTh}">المهام المكتملة</th>
            <th style="${greenTh}">نسبة الحضور</th>
          </tr></thead>
          <tbody>${deptRows}</tbody>
        </table>

        <!-- Employee Details -->
        <div style="${sectionTitle.replace(/#1e40af/g, "#7c3aed")}">٣. تفاصيل الموظفين</div>
        <table style="${tableStyle}">
          <thead><tr>
            <th style="${purpleTh}">الاسم</th>
            <th style="${purpleTh}">القسم</th>
            <th style="${purpleTh}">الوظيفة</th>
            <th style="${purpleTh}">الراتب الأساسي</th>
            <th style="${purpleTh}">أيام الحضور</th>
            <th style="${purpleTh}">أيام الغياب</th>
            <th style="${purpleTh}">نسبة الحضور</th>
            <th style="${purpleTh}">الخصومات</th>
            <th style="${purpleTh}">صافي الراتب</th>
          </tr></thead>
          <tbody>${empDetails}</tbody>
        </table>

        <!-- Tasks -->
        <div style="${sectionTitle.replace(/#1e40af/g, "#ea580c")}">٤. تفاصيل المهام</div>
        <table style="${tableStyle}">
          <thead><tr>
            <th style="${orangeTh}">عنوان المهمة</th>
            <th style="${orangeTh}">مسندة إلى</th>
            <th style="${orangeTh}">الأولوية</th>
            <th style="${orangeTh}">الحالة</th>
            <th style="${orangeTh}">الموعد النهائي</th>
            <th style="${orangeTh}">تاريخ الإنجاز</th>
          </tr></thead>
          <tbody>${taskRows}</tbody>
        </table>

        <!-- Leave Requests -->
        <div style="${sectionTitle.replace(/#1e40af/g, "#0891b2")}">٥. طلبات الإجازات</div>
        <table style="${tableStyle}">
          <thead><tr>
            <th style="${cyanTh}">الموظف</th>
            <th style="${cyanTh}">نوع الإجازة</th>
            <th style="${cyanTh}">تاريخ البداية</th>
            <th style="${cyanTh}">تاريخ النهاية</th>
            <th style="${cyanTh}">الحالة</th>
            <th style="${cyanTh}">السبب</th>
          </tr></thead>
          <tbody>${leaveRowsHtml}</tbody>
        </table>

        <!-- Footer -->
        <div style="text-align:center;margin-top:30px;padding-top:16px;border-top:2px solid #e5e7eb;color:#9ca3af;font-size:11px;">
          Mind_Base X - تقرير سري | تاريخ الإنشاء: ${today}
        </div>
      </div>
    `;
  };

  const exportPDF = async () => {
    setExporting(true);
    try {
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px";
      container.style.top = "0";
      container.style.width = "1100px";
      container.style.background = "#fff";
      container.innerHTML = buildReportHTML();
      document.body.appendChild(container);

      // Wait for fonts to load
      await document.fonts.ready;
      await new Promise(r => setTimeout(r, 300));

      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      document.body.removeChild(container);

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;

      const pdfWidth = 297; // A4 landscape width in mm
      const pdfPageHeight = 210; // A4 landscape height in mm
      const ratio = pdfWidth / imgWidth;
      const scaledHeight = imgHeight * ratio;

      const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });

      let yOffset = 0;
      let pageNum = 0;

      while (yOffset < scaledHeight) {
        if (pageNum > 0) doc.addPage();
        doc.addImage(imgData, "PNG", 0, -yOffset, pdfWidth, scaledHeight);
        yOffset += pdfPageHeight;
        pageNum++;
      }

      doc.save(`mind-base-x-report-${periodLabel}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
    } finally {
      setExporting(false);
    }
  };

  const exportExcel = async () => {
    const wb = new ExcelJS.Workbook();
    wb.creator = "Mind_Base X";
    wb.created = new Date();
    const today = new Date().toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" });
    const attendanceRate = totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const styleHeader = (row: ExcelJS.Row) => {
      row.font = { bold: true, color: { argb: "FFFFFFFF" } };
      row.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF6366F1" } };
      row.alignment = { horizontal: "right", vertical: "middle" };
    };
    const styleTitle = (row: ExcelJS.Row) => {
      row.font = { bold: true, size: 14, color: { argb: "FF4338CA" } };
      row.alignment = { horizontal: "right" };
    };

    // Sheet 1: ملخص الشركة
    const s1 = wb.addWorksheet("ملخص الشركة", { views: [{ rightToLeft: true }] });
    s1.columns = [{ width: 35 }, { width: 25 }];
    styleTitle(s1.addRow(["Mind_Base X - تقرير الشركة"]));
    s1.addRow([`نوع التقرير: ${periodLabel}`]);
    s1.addRow([`تاريخ الإنشاء: ${today}`]);
    s1.addRow([]);
    styleTitle(s1.addRow(["ملخص الشركة"]));
    styleHeader(s1.addRow(["البيان", "القيمة"]));
    [
      ["إجمالي الموظفين النشطين", `${activeEmps.length} موظف`],
      ["إجمالي الرواتب", `${totalSalaries.toLocaleString("ar-EG")} ج.م`],
      ["إجمالي أيام الحضور", `${totalPresent} يوم`],
      ["إجمالي أيام الغياب", `${totalAbsent} يوم`],
      ["نسبة الحضور العامة", `${attendanceRate}%`],
      ["إجمالي المهام", `${tasks.length} مهمة`],
      ["المهام المكتملة", `${completedTasks} مهمة`],
      ["المهام المتأخرة", `${lateTasks} مهمة`],
      ["المهام قيد التنفيذ", `${pendingTasks} مهمة`],
      ["نسبة إنجاز المهام", `${taskCompletionRate}%`],
      ["طلبات الإجازة المعتمدة", `${approvedLeaves} طلب`],
      ["طلبات الإجازة المعلقة", `${pendingLeaves} طلب`],
    ].forEach(r => s1.addRow(r));

    // Sheet 2: تفاصيل الموظفين
    const s2 = wb.addWorksheet("الموظفين", { views: [{ rightToLeft: true }] });
    s2.columns = [{ width: 25 }, { width: 18 }, { width: 18 }, { width: 20 }, { width: 14 }, { width: 14 }, { width: 14 }, { width: 18 }, { width: 20 }];
    styleTitle(s2.addRow(["تفاصيل الموظفين"]));
    s2.addRow([]);
    styleHeader(s2.addRow(["الاسم", "القسم", "الوظيفة", "الراتب الأساسي", "أيام الحضور", "أيام الغياب", "نسبة الحضور", "الخصومات", "صافي الراتب"]));
    activeEmps.forEach(e => {
      const absent = getAbsentDays(e);
      const present = getPresentDays(e);
      const dailyRate = e.salary / 30;
      const deductions = Math.round(absent * dailyRate);
      const net = Math.round(e.salary - deductions);
      s2.addRow([
        e.fullName,
        DEPARTMENTS.find(d => d.value === e.department)?.label || e.department,
        e.role,
        `${e.salary.toLocaleString("ar-EG")} ج.م`,
        `${present} يوم`,
        `${absent} يوم`,
        `${present + absent > 0 ? Math.round((present / (present + absent)) * 100) : 0}%`,
        `-${deductions.toLocaleString("ar-EG")} ج.م`,
        `${net.toLocaleString("ar-EG")} ج.م`,
      ]);
    });

    // Sheet 3: أداء الأقسام
    const s3 = wb.addWorksheet("الأقسام", { views: [{ rightToLeft: true }] });
    s3.columns = [{ width: 20 }, { width: 16 }, { width: 22 }, { width: 14 }, { width: 18 }, { width: 14 }];
    styleTitle(s3.addRow(["أداء الأقسام"]));
    s3.addRow([]);
    styleHeader(s3.addRow(["القسم", "عدد الموظفين", "إجمالي الرواتب", "عدد المهام", "المهام المكتملة", "نسبة الحضور"]));
    deptStats.forEach(d => s3.addRow([d.dept, `${d.employees} موظف`, `${d.totalSalary.toLocaleString("ar-EG")} ج.م`, `${d.tasks} مهمة`, `${d.completedTasks} مهمة`, `${d.avgAttendance}%`]));

    // Sheet 4: المهام
    const s4 = wb.addWorksheet("المهام", { views: [{ rightToLeft: true }] });
    s4.columns = [{ width: 30 }, { width: 22 }, { width: 12 }, { width: 16 }, { width: 16 }, { width: 16 }, { width: 35 }];
    styleTitle(s4.addRow(["تفاصيل المهام"]));
    s4.addRow([]);
    styleHeader(s4.addRow(["عنوان المهمة", "مسندة إلى", "الأولوية", "الحالة", "الموعد النهائي", "تاريخ الإنجاز", "الوصف"]));
    tasks.forEach(t => {
      const emp = employees.find(e => e.id === t.assignedTo);
      s4.addRow([
        t.title,
        emp?.fullName || "-",
        t.priority === "high" ? "عالية" : t.priority === "medium" ? "متوسطة" : "منخفضة",
        t.status === "done" ? "مكتملة" : t.status === "late" ? "متأخرة" : "قيد التنفيذ",
        new Date(t.deadline).toLocaleDateString("ar-EG"),
        t.completedAt ? new Date(t.completedAt).toLocaleDateString("ar-EG") : "-",
        t.description || "-",
      ]);
    });

    // Sheet 5: طلبات الإجازات
    const s5 = wb.addWorksheet("الإجازات", { views: [{ rightToLeft: true }] });
    s5.columns = [{ width: 25 }, { width: 16 }, { width: 18 }, { width: 18 }, { width: 14 }, { width: 35 }];
    styleTitle(s5.addRow(["طلبات الإجازات"]));
    s5.addRow([]);
    styleHeader(s5.addRow(["الموظف", "نوع الإجازة", "تاريخ البداية", "تاريخ النهاية", "الحالة", "السبب"]));
    if (leaveRequests.length === 0) {
      s5.addRow(["لا توجد طلبات إجازة", "", "", "", "", ""]);
    } else {
      leaveRequests.forEach(r => {
        const emp = employees.find(e => e.id === r.employeeId);
        s5.addRow([
          emp?.fullName || "-",
          r.leaveType === "annual" ? "سنوية" : r.leaveType === "sick" ? "مرضية" : r.leaveType === "emergency" ? "طارئة" : "بدون راتب",
          new Date(r.startDate).toLocaleDateString("ar-EG"),
          new Date(r.endDate).toLocaleDateString("ar-EG"),
          r.status === "approved" ? "معتمدة" : r.status === "rejected" ? "مرفوضة" : "معلقة",
          r.reason || "-",
        ]);
      });
    }

    const buf = await wb.xlsx.writeBuffer();
    const blob = new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `mind-base-x-report-${periodLabel}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold font-cairo text-foreground">التقارير</h1>
          <p className="text-muted-foreground text-sm mt-1">تقارير شاملة ومفصلة عن أداء الشركة</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={exportPDF} variant="outline" className="gap-2 font-cairo" disabled={exporting}>
            {exporting ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
            {exporting ? "جاري التحميل..." : "تحميل PDF"}
          </Button>
          <Button onClick={exportExcel} className="gradient-primary text-primary-foreground gap-2 font-cairo"><Download size={16} /> تحميل Excel</Button>
        </div>
      </div>

      {/* Period tabs */}
      <div className="flex gap-2">
        {(["weekly", "monthly", "yearly"] as ReportPeriod[]).map(p => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-4 py-2 rounded-lg text-sm font-cairo font-medium transition-all ${period === p ? "gradient-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:bg-muted"}`}>
            {p === "weekly" ? "أسبوعي" : p === "monthly" ? "شهري" : "سنوي"}
          </button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card text-center"><p className="text-2xl font-bold text-primary">{activeEmps.length}</p><p className="text-xs text-muted-foreground font-cairo">موظف نشط</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-success">{totalSalaries.toLocaleString("ar-EG")}</p><p className="text-xs text-muted-foreground font-cairo">إجمالي الرواتب</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-info">{tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0}%</p><p className="text-xs text-muted-foreground font-cairo">نسبة الإنجاز</p></div>
        <div className="stat-card text-center"><p className="text-2xl font-bold text-warning">{totalPresent + totalAbsent > 0 ? Math.round((totalPresent / (totalPresent + totalAbsent)) * 100) : 0}%</p><p className="text-xs text-muted-foreground font-cairo">نسبة الحضور</p></div>
      </div>

      {/* Department breakdown */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="p-5 border-b border-border"><h2 className="text-lg font-bold font-cairo text-foreground">أداء الأقسام</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-sm font-bold font-cairo text-foreground">القسم</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">الموظفين</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">إجمالي الرواتب</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">المهام</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">مكتملة</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">نسبة الحضور</th>
              </tr>
            </thead>
            <tbody>
              {deptStats.map(d => (
                <tr key={d.dept} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium font-cairo text-foreground">{d.dept}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{d.employees}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-foreground font-cairo">{d.totalSalary.toLocaleString("ar-EG")}</td>
                  <td className="px-4 py-3 text-center text-sm text-muted-foreground">{d.tasks}</td>
                  <td className="px-4 py-3 text-center text-sm font-bold text-success">{d.completedTasks}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-muted rounded-full h-2"><div className={`h-2 rounded-full ${d.avgAttendance >= 80 ? "bg-success" : d.avgAttendance >= 60 ? "bg-warning" : "bg-destructive"}`} style={{ width: `${d.avgAttendance}%` }} /></div>
                      <span className="text-xs text-muted-foreground">{d.avgAttendance}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee details table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="p-5 border-b border-border"><h2 className="text-lg font-bold font-cairo text-foreground">تفاصيل الموظفين</h2></div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-right px-4 py-3 text-sm font-bold font-cairo text-foreground">الموظف</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">القسم</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">الراتب</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">حضور</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">غياب</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">خصومات</th>
                <th className="text-center px-4 py-3 text-sm font-bold font-cairo text-foreground">صافي</th>
              </tr>
            </thead>
            <tbody>
              {activeEmps.map(emp => {
                const absent = getAbsentDays(emp);
                const present = getPresentDays(emp);
                const dailyRate = emp.salary / 30;
                const deductions = Math.round(absent * dailyRate);
                const net = Math.round(emp.salary - deductions);
                return (
                  <tr key={emp.id} className="border-b border-border/50 hover:bg-muted/20 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium font-cairo text-foreground">{emp.fullName}</td>
                    <td className="px-4 py-3 text-center text-sm text-muted-foreground font-cairo">{DEPARTMENTS.find(d => d.value === emp.department)?.label}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-foreground font-cairo">{emp.salary.toLocaleString("ar-EG")}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-success">{present}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-destructive">{absent}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-destructive font-cairo">-{deductions.toLocaleString("ar-EG")}</td>
                    <td className="px-4 py-3 text-center text-sm font-bold text-success font-cairo">{net.toLocaleString("ar-EG")}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tasks summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-bold font-cairo text-foreground mb-4">ملخص المهام</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><p className="text-2xl font-bold text-success">{completedTasks}</p><p className="text-xs text-muted-foreground font-cairo">مكتملة</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-warning">{pendingTasks}</p><p className="text-xs text-muted-foreground font-cairo">قيد التنفيذ</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-destructive">{lateTasks}</p><p className="text-xs text-muted-foreground font-cairo">متأخرة</p></div>
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-5" style={{ boxShadow: "var(--shadow-card)" }}>
          <h2 className="text-lg font-bold font-cairo text-foreground mb-4">ملخص الإجازات</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center"><p className="text-2xl font-bold text-success">{approvedLeaves}</p><p className="text-xs text-muted-foreground font-cairo">معتمدة</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-warning">{pendingLeaves}</p><p className="text-xs text-muted-foreground font-cairo">معلقة</p></div>
            <div className="text-center"><p className="text-2xl font-bold text-destructive">{leaveRequests.filter(r => r.status === "rejected").length}</p><p className="text-xs text-muted-foreground font-cairo">مرفوضة</p></div>
          </div>
        </div>
      </div>
    </div>
  );
}
