import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function ChangePasswordPage() {
  const { changePassword, user } = useAuth();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (pw.length < 8) return setError("كلمة المرور لازم تكون 8 حروف على الأقل");
    if (pw !== pw2) return setError("كلمة المرور غير متطابقة");
    setLoading(true);
    const res = await changePassword(pw);
    setLoading(false);
    if (!res.success) return setError(res.error || "فشل تغيير كلمة المرور");
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <div className="w-full max-w-md bg-card rounded-2xl border border-border p-8">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl gradient-primary mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="text-primary-foreground" size={28} />
          </div>
          <h1 className="text-xl font-bold font-cairo">تغيير كلمة المرور</h1>
          <p className="text-sm text-muted-foreground font-cairo mt-1">
            مرحباً {user?.name} — لازم تغيّر كلمة المرور قبل ما تكمل
          </p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-sm font-cairo block mb-1.5">كلمة المرور الجديدة</label>
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required minLength={8} dir="ltr" />
          </div>
          <div>
            <label className="text-sm font-cairo block mb-1.5">تأكيد كلمة المرور</label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required minLength={8} dir="ltr" />
          </div>
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm rounded-lg p-3 font-cairo text-center">
              {error}
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground h-12 font-cairo">
            <Lock size={16} className="me-2" /> {loading ? "جاري الحفظ..." : "حفظ كلمة المرور"}
          </Button>
        </form>
      </div>
    </div>
  );
}
