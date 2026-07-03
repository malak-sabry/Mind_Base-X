import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Mail, Lock, Save, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function SettingsPage() {
  const { user, updateEmail, changePassword } = useAuth();
  const [newEmail, setNewEmail] = useState(user?.email || "");
  const [newPw, setNewPw] = useState("");
  const [companyName, setCompanyName] = useState("MBX");
  const [tagline, setTagline] = useState("Mind_Base X");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("app_settings").select("*").eq("id", 1).maybeSingle().then(({ data }) => {
      if (data) {
        setCompanyName(data.company_name);
        setTagline(data.company_tagline);
      }
    });
  }, []);

  const saveEmail = async () => {
    setLoading(true);
    const r = await updateEmail(newEmail);
    setLoading(false);
    toast[r.success ? "success" : "error"](r.success ? "تم تحديث البريد" : r.error || "فشل");
  };
  const savePw = async () => {
    if (newPw.length < 8) return toast.error("كلمة المرور 8 حروف على الأقل");
    setLoading(true);
    const r = await changePassword(newPw);
    setLoading(false);
    if (r.success) { setNewPw(""); toast.success("تم تغيير كلمة المرور"); } else toast.error(r.error || "فشل");
  };
  const saveCompany = async () => {
    setLoading(true);
    const { error } = await supabase.from("app_settings").update({
      company_name: companyName, company_tagline: tagline, updated_at: new Date().toISOString(),
    }).eq("id", 1);
    setLoading(false);
    toast[error ? "error" : "success"](error ? error.message : "تم حفظ بيانات الشركة");
  };

  return (
    <div className="space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold font-cairo">الإعدادات</h1>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-bold font-cairo flex items-center gap-2"><Mail size={18} /> البريد الإلكتروني</h2>
        <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} dir="ltr" />
        <Button onClick={saveEmail} disabled={loading} className="gradient-primary text-primary-foreground font-cairo">
          <Save size={16} className="me-2" /> حفظ البريد
        </Button>
      </section>

      <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
        <h2 className="font-bold font-cairo flex items-center gap-2"><Lock size={18} /> كلمة المرور</h2>
        <Input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="كلمة مرور جديدة (8 حروف+)" dir="ltr" />
        <Button onClick={savePw} disabled={loading} className="gradient-primary text-primary-foreground font-cairo">
          <Save size={16} className="me-2" /> تغيير كلمة المرور
        </Button>
      </section>

      {user?.role === "manager" && (
        <section className="bg-card border border-border rounded-2xl p-6 space-y-3">
          <h2 className="font-bold font-cairo flex items-center gap-2"><Building2 size={18} /> بيانات الشركة</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-cairo block mb-1">اسم الشركة المختصر</label>
              <Input value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </div>
            <div>
              <label className="text-sm font-cairo block mb-1">الوصف تحت الاسم</label>
              <Input value={tagline} onChange={(e) => setTagline(e.target.value)} />
            </div>
          </div>
          <Button onClick={saveCompany} disabled={loading} className="gradient-primary text-primary-foreground font-cairo">
            <Save size={16} className="me-2" /> حفظ بيانات الشركة
          </Button>
        </section>
      )}
    </div>
  );
}
