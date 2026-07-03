
-- ============ Drop permissive 'public' policies ============
DROP POLICY IF EXISTS "Allow all access to attendance" ON public.attendance;
DROP POLICY IF EXISTS "Allow all access to employees" ON public.employees;
DROP POLICY IF EXISTS "Allow all access to leave_requests" ON public.leave_requests;
DROP POLICY IF EXISTS "Allow all access to notifications" ON public.notifications;
DROP POLICY IF EXISTS "Allow all access to tasks" ON public.tasks;
DROP POLICY IF EXISTS "all access crm_accounts" ON public.crm_accounts;
DROP POLICY IF EXISTS "all access crm_activities" ON public.crm_activities;
DROP POLICY IF EXISTS "all access crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "all access crm_deals" ON public.crm_deals;

-- ============ Revoke anon access on all sensitive tables ============
REVOKE ALL ON public.attendance, public.employees, public.leave_requests,
  public.notifications, public.tasks, public.crm_accounts, public.crm_activities,
  public.crm_contacts, public.crm_deals, public.chat_messages, public.crm_notes,
  public.erp_machines, public.user_roles FROM anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance, public.leave_requests,
  public.notifications, public.tasks, public.crm_accounts, public.crm_activities,
  public.crm_contacts, public.crm_deals TO authenticated;
GRANT SELECT, UPDATE ON public.employees TO authenticated;

-- ============ Drop plaintext password column ============
ALTER TABLE public.employees DROP COLUMN IF EXISTS password;

-- ============ Employees: authenticated read, manager full write, self update only ============
CREATE POLICY "authenticated read employees" ON public.employees
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "managers insert employees" ON public.employees
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "managers delete employees" ON public.employees
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'manager'));
CREATE POLICY "managers or self update employees" ON public.employees
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'manager') OR user_id = auth.uid())
  WITH CHECK (public.has_role(auth.uid(), 'manager') OR user_id = auth.uid());

-- ============ Attendance, tasks, leaves, notifications, crm: authenticated full access ============
CREATE POLICY "authenticated all attendance" ON public.attendance
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all tasks" ON public.tasks
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all leave_requests" ON public.leave_requests
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all notifications" ON public.notifications
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all crm_accounts" ON public.crm_accounts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all crm_activities" ON public.crm_activities
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all crm_contacts" ON public.crm_contacts
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "authenticated all crm_deals" ON public.crm_deals
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ============ Tighten chat insert: prevent sender_user_id spoofing ============
DROP POLICY IF EXISTS "auth insert chat" ON public.chat_messages;
CREATE POLICY "auth insert chat" ON public.chat_messages
  FOR INSERT TO authenticated
  WITH CHECK (sender_user_id = auth.uid());

-- ============ Remove employees from realtime publication to stop leaking sensitive fields ============
ALTER PUBLICATION supabase_realtime DROP TABLE public.employees;
