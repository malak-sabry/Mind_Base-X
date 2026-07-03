import { useState } from "react";
import { useHR } from "@/contexts/HRContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DEPARTMENTS } from "@/types/hr";
import type { Employee } from "@/types/hr";

interface Props {
  onClose: () => void;
  editEmployee?: Employee;
}

export function AddEmployeeForm({ onClose, editEmployee }: Props) {
  const { addEmployee, updateEmployee } = useHR();
  const isEditing = !!editEmployee;

  const [form, setForm] = useState({
    fullName: editEmployee?.fullName || "",
    phone: editEmployee?.phone || "",
    email: editEmployee?.email || "",
    department: editEmployee?.department || "engineering",
    role: editEmployee?.role || "",
    salary: editEmployee?.salary?.toString() || "",
    joinDate: editEmployee?.joinDate || new Date().toISOString().split("T")[0],
    gender: editEmployee?.gender || "male" as "male" | "female",
    skills: editEmployee?.skills?.join(", ") || "",
    languages: editEmployee?.languages?.join(", ") || "",
    nationality: editEmployee?.nationality || "",
    address: editEmployee?.address || "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && !form.password.trim()) {
      const ok = window.confirm("لم تضع كلمة مرور — الموظف لن يستطيع تسجيل الدخول. متابعة بدون كلمة مرور؟");
      if (!ok) return;
    }
    const data = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      email: form.email.trim().toLowerCase(),
      department: form.department,
      role: form.role.trim(),
      salary: Number(form.salary) || 0,
      joinDate: form.joinDate,
      gender: form.gender as "male" | "female",
      skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
      languages: form.languages.split(",").map((s) => s.trim()).filter(Boolean),
      nationality: form.nationality.trim(),
      address: form.address.trim(),
      password: form.password.trim(),
    };
    if (isEditing && editEmployee) {
      await updateEmployee(editEmployee.id, data);
    } else {
      await addEmployee(data as any);
    }
    onClose();
  };

  const update = (key: string, value: string) => setForm((p) => ({ ...p, [key]: value }));

  const fields = [
    { key: "fullName", label: "الاسم الكامل", type: "text", required: true },
    { key: "phone", label: "رقم التليفون", type: "tel", required: true },
    { key: "email", label: "البريد الإلكتروني", type: "email", required: true },
    { key: "role", label: "الوظيفة", type: "text", required: true },
    { key: "salary", label: "الراتب الشهري", type: "number", required: true },
    { key: "joinDate", label: "تاريخ الانضمام", type: "date", required: true },
    { key: "nationality", label: "الجنسية", type: "text", required: false },
    { key: "address", label: "العنوان", type: "text", required: false },
    { key: "skills", label: "المهارات (مفصولة بفاصلة)", type: "text", required: false },
    { key: "languages", label: "اللغات (مفصولة بفاصلة)", type: "text", required: false },
    { key: "password", label: isEditing ? "كلمة مرور جديدة (اختياري)" : "كلمة مرور تسجيل الدخول", type: "password", required: !isEditing },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {fields.map((f) => (
          <div key={f.key}>
            <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">{f.label}</label>
            <Input
              type={f.type}
              value={(form as any)[f.key]}
              onChange={(e) => update(f.key, e.target.value)}
              required={f.required}
              className="font-cairo"
            />
          </div>
        ))}
        <div>
          <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">القسم</label>
          <select
            value={form.department}
            onChange={(e) => update("department", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo"
          >
            {DEPARTMENTS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground font-cairo block mb-1.5">النوع</label>
          <select
            value={form.gender}
            onChange={(e) => update("gender", e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-input bg-card text-foreground text-sm font-cairo"
          >
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>
      </div>
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-cairo">إلغاء</Button>
        <Button type="submit" className="flex-1 gradient-primary text-primary-foreground font-cairo">
          {isEditing ? "حفظ التعديلات" : "إضافة الموظف"}
        </Button>
      </div>
    </form>
  );
}
