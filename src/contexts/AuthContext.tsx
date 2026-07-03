import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";

export type UserRole = "manager" | "hr" | "supervisor" | "employee";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
  name: string;
  department?: string;
  photo?: string;
  mustChangePassword?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  changePassword: (newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateEmail: (newEmail: string) => Promise<{ success: boolean; error?: string }>;
  isAuthenticated: boolean;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// bootstrap-manager edge function removed: the default manager already exists
// in the database; recreating it from the client is a security risk.

async function loadProfile(session: Session): Promise<AuthUser | null> {
  const userId = session.user.id;
  const email = session.user.email ?? "";

  const [rolesRes, empByUserRes] = await Promise.all([
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase
      .from("employees")
      .select("id, full_name, department, photo, must_change_password")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);
  const roles = rolesRes.data;
  let emp = empByUserRes.data;
  if (!emp && email) {
    const { data } = await supabase
      .from("employees")
      .select("id, full_name, department, photo, must_change_password")
      .ilike("email", email)
      .maybeSingle();
    emp = data;
  }
  const role: UserRole =
    (roles?.find((r: any) => r.role === "manager")?.role as UserRole) ||
    (roles?.[0]?.role as UserRole) ||
    "employee";

  return {
    id: userId,
    email,
    role,
    employeeId: emp?.id,
    name: emp?.full_name || (role === "manager" ? "المدير" : email),
    department: emp?.department,
    photo: emp?.photo || undefined,
    mustChangePassword: emp?.must_change_password ?? false,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const heartbeatRef = useRef<number | null>(null);

  useEffect(() => {
    let resolved = false;
    const finish = () => { if (!resolved) { resolved = true; setLoading(false); } };


    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s) {
        setTimeout(() => {
          loadProfile(s).then((p) => { setUser(p); finish(); });
        }, 0);
      } else {
        setUser(null);
        finish();
      }
    });

    // Safety net: if no auth event fires quickly, clear loading from getSession.
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!s) finish();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  // Online presence heartbeat (only for employees linked to a row)
  useEffect(() => {
    if (!user?.employeeId) return;

    const markOnline = async () => {
      const now = new Date().toISOString();
      await supabase
        .from("employees")
        .update({ is_online: true, last_login_at: now })
        .eq("id", user.employeeId);
    };
    const markOffline = async () => {
      const now = new Date().toISOString();
      await supabase
        .from("employees")
        .update({ is_online: false, last_logout_at: now })
        .eq("id", user.employeeId);
    };

    markOnline();
    heartbeatRef.current = window.setInterval(markOnline, 60_000);

    const onBeforeUnload = () => {
      // best-effort
      if (!session?.access_token) return;
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/employees?id=eq.${user.employeeId}`, {
        method: "PATCH",
        keepalive: true,
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal",
        },
        body: JSON.stringify({ is_online: false, last_logout_at: new Date().toISOString() }),
      }).catch(() => undefined);
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") markOnline();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("pagehide", onBeforeUnload);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("pagehide", onBeforeUnload);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      markOffline();
    };
  }, [session?.access_token, user?.employeeId]);

  const login = useCallback(async (email: string, password: string) => {
    const trimEmail = email.trim().toLowerCase();
    const { error } = await supabase.auth.signInWithPassword({ email: trimEmail, password });
    if (error) return { success: false, error: "البريد الإلكتروني أو كلمة المرور غير صحيحة" };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    if (user?.employeeId) {
      const now = new Date().toISOString();
      await supabase
        .from("employees")
        .update({ is_online: false, last_logout_at: now })
        .eq("id", user.employeeId);
    }
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  }, [user?.employeeId, user?.name]);

  const changePassword = useCallback(
    async (newPassword: string) => {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) return { success: false, error: error.message };
      if (user?.employeeId) {
        await supabase.from("employees").update({ must_change_password: false }).eq("id", user.employeeId);
        setUser((u) => (u ? { ...u, mustChangePassword: false } : u));
      }
      return { success: true };
    },
    [user?.employeeId]
  );

  const updateEmail = useCallback(async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail.trim().toLowerCase() });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const refresh = useCallback(async () => {
    if (session) {
      const p = await loadProfile(session);
      setUser(p);
    }
  }, [session]);

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        login,
        logout,
        changePassword,
        updateEmail,
        refresh,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
