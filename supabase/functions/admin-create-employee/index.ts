import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Caller must be authenticated and a manager
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "missing_auth" }, 401);

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) return json({ error: "not_authenticated" }, 401);

    const { data: roles } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userData.user.id);
    if (!roles?.some((r: any) => r.role === "manager"))
      return json({ error: "forbidden_manager_only" }, 403);

    const body = await req.json().catch(() => ({}));
    const { email, password, employee_id, role = "employee", full_name } = body ?? {};
    if (!email || !password || !employee_id)
      return json({ error: "email_password_employee_id_required" }, 400);

    const cleanEmail = String(email).trim().toLowerCase();

    // Try create, if exists update password
    let userId: string | undefined;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cleanEmail,
      password,
      email_confirm: true,
      user_metadata: { full_name, employee_id },
    });
    if (created?.user?.id) {
      userId = created.user.id;
    } else {
      // find existing user
      let page = 1;
      while (!userId && page <= 5) {
        const { data: list } = await admin.auth.admin.listUsers({ page, perPage: 200 });
        userId = list?.users.find((u) => u.email?.toLowerCase() === cleanEmail)?.id;
        if (!list || list.users.length < 200) break;
        page++;
      }
      if (userId) {
        const { error: updErr } = await admin.auth.admin.updateUserById(userId, {
          password,
          email_confirm: true,
        });
        if (updErr) return json({ error: "update_user_failed", detail: updErr.message }, 500);
      } else {
        return json(
          { error: "create_user_failed", detail: createErr?.message || "unknown" },
          500
        );
      }
    }

    // Assign role
    const { error: roleErr } = await admin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id,role" });
    if (roleErr) return json({ error: "role_assign_failed", detail: roleErr.message }, 500);

    // Link to employee row
    const { error: linkErr } = await admin
      .from("employees")
      .update({
        user_id: userId,
        must_change_password: true,
        email: cleanEmail,
      })
      .eq("id", employee_id);
    if (linkErr) return json({ error: "link_employee_failed", detail: linkErr.message }, 500);

    return json({ ok: true, user_id: userId, email: cleanEmail });
  } catch (e) {
    return json({ error: "exception", detail: String(e) }, 500);
  }
});
