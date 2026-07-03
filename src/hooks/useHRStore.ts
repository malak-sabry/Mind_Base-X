import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Employee, Task, LeaveRequest, Notification } from "@/types/hr";

export function useHRStore() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch all data
  const fetchAll = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [empRes, taskRes, attRes, leaveRes, notifRes] = await Promise.all([
        supabase.from("employees").select("*").order("created_at", { ascending: true }),
        supabase.from("tasks").select("*").order("created_at", { ascending: false }),
        supabase.from("attendance").select("*"),
        supabase.from("leave_requests").select("*").order("created_at", { ascending: false }),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }),
      ]);

      const attendanceMap: Record<string, Employee["attendance"]> = {};
      (attRes.data || []).forEach((a) => {
        if (!attendanceMap[a.employee_id]) attendanceMap[a.employee_id] = [];
        attendanceMap[a.employee_id].push({ date: a.date, present: a.present, note: a.note || undefined });
      });

      const emps: Employee[] = (empRes.data || []).map((e: any) => ({
        id: e.id,
        fullName: e.full_name,
        phone: e.phone,
        email: e.email,
        department: e.department,
        role: e.role,
        salary: Number(e.salary),
        joinDate: e.join_date,
        gender: e.gender as "male" | "female",
        skills: e.skills || [],
        languages: e.languages || [],
        photo: e.photo || undefined,
        nationality: e.nationality || "",
        address: e.address || "",
        status: e.status as "active" | "inactive",
        attendance: attendanceMap[e.id] || [],
        password: undefined,
        isOnline: !!e.is_online,
        lastLoginAt: e.last_login_at || undefined,
        lastLogoutAt: e.last_logout_at || undefined,
      }));

      const tks: Task[] = (taskRes.data || []).map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description || "",
        notes: t.notes || "",
        assignedTo: t.assigned_to,
        createdAt: t.created_at,
        deadline: t.deadline,
        status: t.status as "pending" | "done" | "late",
        completedAt: t.completed_at || undefined,
        priority: t.priority as "low" | "medium" | "high",
      }));

      const leaves: LeaveRequest[] = (leaveRes.data || []).map((l) => ({
        id: l.id,
        employeeId: l.employee_id,
        leaveType: l.leave_type,
        startDate: l.start_date,
        endDate: l.end_date,
        reason: l.reason,
        status: l.status as "pending" | "approved" | "rejected",
        managerNote: l.manager_note || undefined,
        createdAt: l.created_at,
      }));

      const notifs: Notification[] = (notifRes.data || []).map((n) => ({
        id: n.id,
        targetRole: n.target_role,
        targetEmployeeId: n.target_employee_id || undefined,
        title: n.title,
        message: n.message,
        type: n.type as "info" | "warning" | "success" | "error",
        isRead: n.is_read,
        createdAt: n.created_at,
      }));

      setEmployees(emps);
      setTasks(tks);
      setLeaveRequests(leaves);
      setNotifications(notifs);
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll(true);
  }, [fetchAll]);

  // Realtime: refresh on any change to core tables (debounced)
  useEffect(() => {
    let t: any;
    const schedule = () => { clearTimeout(t); t = setTimeout(() => fetchAll(false), 400); };
    const channel = supabase
      .channel("hr-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "attendance" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "employees" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, schedule)
      .on("postgres_changes", { event: "*", schema: "public", table: "leave_requests" }, schedule)
      .subscribe();
    return () => { clearTimeout(t); supabase.removeChannel(channel); };
  }, [fetchAll]);

  const addEmployee = useCallback(async (emp: Omit<Employee, "id" | "attendance" | "status">) => {
    const { data, error } = await supabase.from("employees").insert({
      full_name: emp.fullName,
      phone: emp.phone,
      email: emp.email,
      department: emp.department,
      role: emp.role,
      salary: emp.salary,
      join_date: emp.joinDate,
      gender: emp.gender,
      skills: emp.skills,
      languages: emp.languages,
      nationality: emp.nationality,
      address: emp.address,
      
      status: "active",
    }).select().single();
    if (error) { toast.error("فشل إضافة الموظف: " + error.message); return null; }

    // Create auth account for the employee so they can login
    const password = (emp as any).password?.trim();
    if (password && emp.email) {
      const { data: fnData, error: fnErr } = await supabase.functions.invoke("admin-create-employee", {
        body: {
          email: emp.email,
          password,
          employee_id: data.id,
          full_name: emp.fullName,
          role: "employee",
        },
      });
      if (fnErr || (fnData as any)?.error) {
        const msg = (fnData as any)?.detail || (fnData as any)?.error || fnErr?.message || "غير معروف";
        toast.error("تم حفظ الموظف لكن فشل إنشاء حساب الدخول: " + msg);
      } else {
        toast.success(`تم إنشاء حساب الدخول للموظف بنجاح — ${emp.email}`);
      }
    } else if (!password) {
      toast.warning("لم يتم تعيين كلمة مرور — لن يستطيع الموظف تسجيل الدخول حتى تضيف واحدة.");
    }

    await fetchAll();
    return data;
  }, [fetchAll]);

  const resetEmployeeLogin = useCallback(async (employeeId: string, newPassword: string) => {
    const emp = (await supabase.from("employees").select("email,full_name").eq("id", employeeId).maybeSingle()).data;
    if (!emp?.email) { toast.error("لا يوجد بريد لهذا الموظف"); return false; }
    const { data: fnData, error: fnErr } = await supabase.functions.invoke("admin-create-employee", {
      body: {
        email: emp.email,
        password: newPassword,
        employee_id: employeeId,
        full_name: emp.full_name,
        role: "employee",
      },
    });
    if (fnErr || (fnData as any)?.error) {
      const msg = (fnData as any)?.detail || (fnData as any)?.error || fnErr?.message || "غير معروف";
      toast.error("فشل إعادة تعيين الحساب: " + msg);
      return false;
    }
    toast.success("تم إعادة تعيين بيانات الدخول للموظف");
    await fetchAll();
    return true;
  }, [fetchAll]);

  const updateEmployee = useCallback(async (id: string, updates: Partial<Employee>) => {
    const dbUpdates: any = {};
    if (updates.fullName !== undefined) dbUpdates.full_name = updates.fullName;
    if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.department !== undefined) dbUpdates.department = updates.department;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.salary !== undefined) dbUpdates.salary = updates.salary;
    if (updates.joinDate !== undefined) dbUpdates.join_date = updates.joinDate;
    if (updates.gender !== undefined) dbUpdates.gender = updates.gender;
    if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
    if (updates.languages !== undefined) dbUpdates.languages = updates.languages;
    if (updates.nationality !== undefined) dbUpdates.nationality = updates.nationality;
    if (updates.address !== undefined) dbUpdates.address = updates.address;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    

    // Handle attendance updates
    if (updates.attendance !== undefined) {
      // We handle attendance separately via the attendance table
    }

    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("employees").update(dbUpdates).eq("id", id);
    }

    // Handle attendance
    if (updates.attendance) {
      for (const att of updates.attendance) {
        await supabase.from("attendance").upsert({
          employee_id: id,
          date: att.date,
          present: att.present,
          note: att.note || null,
        }, { onConflict: "employee_id,date" });
      }
    }

    await fetchAll();
  }, [fetchAll]);

  const markAttendance = useCallback(async (employeeId: string, date: string, present: boolean, note?: string) => {
    await supabase.from("attendance").upsert({
      employee_id: employeeId,
      date,
      present,
      note: note || null,
    }, { onConflict: "employee_id,date" });
    await fetchAll();
  }, [fetchAll]);

  const deleteEmployee = useCallback(async (id: string) => {
    await supabase.from("employees").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  const addTask = useCallback(async (task: Omit<Task, "id" | "createdAt" | "status">) => {
    const { data, error } = await supabase.from("tasks").insert({
      title: task.title,
      description: task.description,
      notes: task.notes,
      assigned_to: task.assignedTo,
      deadline: task.deadline,
      priority: task.priority,
      status: "pending",
    }).select().single();
    if (error) { console.error(error); return null; }

    // Create notification for employee
    const emp = employees.find(e => e.id === task.assignedTo);
    if (emp) {
      await supabase.from("notifications").insert({
        target_role: "employee",
        target_employee_id: task.assignedTo,
        title: "مهمة جديدة",
        message: `تم تعيين مهمة جديدة لك: ${task.title}`,
        type: "info",
      });
    }

    await fetchAll();
    return data;
  }, [fetchAll, employees]);

  const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
    const dbUpdates: any = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.notes !== undefined) dbUpdates.notes = updates.notes;
    if (updates.assignedTo !== undefined) dbUpdates.assigned_to = updates.assignedTo;
    if (updates.deadline !== undefined) dbUpdates.deadline = updates.deadline;
    if (updates.priority !== undefined) dbUpdates.priority = updates.priority;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.completedAt !== undefined) dbUpdates.completed_at = updates.completedAt;
    await supabase.from("tasks").update(dbUpdates).eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  const deleteTask = useCallback(async (id: string) => {
    await supabase.from("tasks").delete().eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  const completeTask = useCallback(async (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    const now = new Date();
    const deadline = new Date(task.deadline);
    const status = now > deadline ? "late" : "done";
    await supabase.from("tasks").update({ status, completed_at: now.toISOString() }).eq("id", id);
    await fetchAll();
  }, [fetchAll, tasks]);

  // Leave requests
  const addLeaveRequest = useCallback(async (req: Omit<LeaveRequest, "id" | "createdAt" | "status">) => {
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: req.employeeId,
      leave_type: req.leaveType,
      start_date: req.startDate,
      end_date: req.endDate,
      reason: req.reason,
      status: "pending",
    });
    if (error) { console.error(error); return; }

    const emp = employees.find(e => e.id === req.employeeId);
    await supabase.from("notifications").insert({
      target_role: "manager",
      title: "طلب إجازة جديد",
      message: `${emp?.fullName || "موظف"} طلب إجازة من ${req.startDate} إلى ${req.endDate}`,
      type: "warning",
    });

    await fetchAll();
  }, [fetchAll, employees]);

  const updateLeaveRequest = useCallback(async (id: string, status: "approved" | "rejected", managerNote?: string) => {
    await supabase.from("leave_requests").update({ status, manager_note: managerNote || null }).eq("id", id);
    
    const req = leaveRequests.find(r => r.id === id);
    if (req) {
      await supabase.from("notifications").insert({
        target_role: "employee",
        target_employee_id: req.employeeId,
        title: status === "approved" ? "تمت الموافقة على طلب الإجازة" : "تم رفض طلب الإجازة",
        message: status === "approved" ? `تمت الموافقة على إجازتك من ${req.startDate} إلى ${req.endDate}` : `تم رفض طلب إجازتك. ${managerNote || ""}`,
        type: status === "approved" ? "success" : "error",
      });
    }

    await fetchAll();
  }, [fetchAll, leaveRequests]);

  // Notifications
  const markNotificationRead = useCallback(async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    await fetchAll();
  }, [fetchAll]);

  const markAllNotificationsRead = useCallback(async (role: string, employeeId?: string) => {
    const visible = notifications.filter(n => {
      if (n.isRead) return false;
      if (role === "manager") return n.targetRole === "manager" || n.targetRole === "all";
      return n.targetRole === "all" || n.targetEmployeeId === employeeId;
    });
    const ids = visible.map(n => n.id);
    if (ids.length === 0) return;
    await supabase.from("notifications").update({ is_read: true }).in("id", ids);
    await fetchAll();
  }, [fetchAll, notifications]);

  const getEmployeeById = useCallback(
    (id: string) => employees.find((e) => e.id === id),
    [employees]
  );

  const getTasksForEmployee = useCallback(
    (empId: string) => tasks.filter((t) => t.assignedTo === empId),
    [tasks]
  );

  const getAbsentDays = useCallback((emp: Employee) => {
    return emp.attendance.filter((a) => !a.present).length;
  }, []);

  const getPresentDays = useCallback((emp: Employee) => {
    return emp.attendance.filter((a) => a.present).length;
  }, []);

  const hasExcessiveAbsence = useCallback((emp: Employee) => {
    return getAbsentDays(emp) > 5;
  }, [getAbsentDays]);

  const getLeaveRequestsForEmployee = useCallback(
    (empId: string) => leaveRequests.filter(r => r.employeeId === empId),
    [leaveRequests]
  );

  const getNotificationsForRole = useCallback(
    (role: string, employeeId?: string) => {
      if (role === "manager") return notifications.filter(n => n.targetRole === "manager" || n.targetRole === "all");
      return notifications.filter(n => n.targetRole === "all" || n.targetEmployeeId === employeeId);
    },
    [notifications]
  );

  const stats = {
    totalEmployees: employees.filter((e) => e.status === "active").length,
    totalTasks: tasks.length,
    pendingTasks: tasks.filter((t) => t.status === "pending").length,
    completedTasks: tasks.filter((t) => t.status === "done").length,
    lateTasks: tasks.filter((t) => t.status === "late").length,
    completionRate: tasks.length > 0 ? Math.round((tasks.filter((t) => t.status === "done").length / tasks.length) * 100) : 0,
    absenceAlerts: employees.filter((e) => hasExcessiveAbsence(e)).length,
    pendingLeaves: leaveRequests.filter(r => r.status === "pending").length,
  };

  return {
    employees,
    tasks,
    leaveRequests,
    notifications,
    stats,
    loading,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    resetEmployeeLogin,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    getEmployeeById,
    getTasksForEmployee,
    getAbsentDays,
    getPresentDays,
    hasExcessiveAbsence,
    markAttendance,
    addLeaveRequest,
    updateLeaveRequest,
    getLeaveRequestsForEmployee,
    getNotificationsForRole,
    markNotificationRead,
    markAllNotificationsRead,
    fetchAll,
  };
}
