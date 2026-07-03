CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.can_access_crm_entity(_entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    public.has_role(auth.uid(), 'manager'::app_role)
    OR CASE _entity_type
      WHEN 'account' THEN EXISTS (SELECT 1 FROM public.crm_accounts a WHERE a.id = _entity_id AND a.owner_employee_id = public.current_employee_id())
      WHEN 'contact' THEN EXISTS (SELECT 1 FROM public.crm_contacts c WHERE c.id = _entity_id AND c.owner_employee_id = public.current_employee_id())
      WHEN 'deal' THEN EXISTS (SELECT 1 FROM public.crm_deals d WHERE d.id = _entity_id AND d.owner_employee_id = public.current_employee_id())
      WHEN 'activity' THEN EXISTS (SELECT 1 FROM public.crm_activities ac WHERE ac.id = _entity_id AND ac.owner_employee_id = public.current_employee_id())
      ELSE false
    END
$$;

CREATE OR REPLACE FUNCTION public.can_access_note(_entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    CASE
      WHEN _entity_type IN ('account','contact','deal','activity') THEN public.can_access_crm_entity(_entity_type, _entity_id)
      WHEN _entity_type = 'task' THEN public.has_role(auth.uid(), 'manager'::app_role) OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = _entity_id AND t.assigned_to = public.current_employee_id())
      WHEN _entity_type = 'erp_machine' THEN public.has_role(auth.uid(), 'manager'::app_role) OR EXISTS (SELECT 1 FROM public.erp_machines m WHERE m.id = _entity_id AND m.responsible_employee_id = public.current_employee_id())
      ELSE public.has_role(auth.uid(), 'manager'::app_role)
    END
$$;

DROP POLICY IF EXISTS "authenticated all crm_accounts" ON public.crm_accounts;
DROP POLICY IF EXISTS "authenticated all crm_contacts" ON public.crm_contacts;
DROP POLICY IF EXISTS "authenticated all crm_deals" ON public.crm_deals;
DROP POLICY IF EXISTS "authenticated all crm_activities" ON public.crm_activities;

CREATE POLICY "manager read all accounts employee own accounts" ON public.crm_accounts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role) OR owner_employee_id = public.current_employee_id());
CREATE POLICY "employee insert own accounts" ON public.crm_accounts FOR INSERT TO authenticated WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee update own accounts" ON public.crm_accounts FOR UPDATE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id()) WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee delete own accounts" ON public.crm_accounts FOR DELETE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());

CREATE POLICY "manager read all contacts employee own contacts" ON public.crm_contacts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role) OR owner_employee_id = public.current_employee_id());
CREATE POLICY "employee insert own contacts" ON public.crm_contacts FOR INSERT TO authenticated WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee update own contacts" ON public.crm_contacts FOR UPDATE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id()) WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee delete own contacts" ON public.crm_contacts FOR DELETE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());

CREATE POLICY "manager read all deals employee own deals" ON public.crm_deals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role) OR owner_employee_id = public.current_employee_id());
CREATE POLICY "employee insert own deals" ON public.crm_deals FOR INSERT TO authenticated WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee update own deals" ON public.crm_deals FOR UPDATE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id()) WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee delete own deals" ON public.crm_deals FOR DELETE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());

CREATE POLICY "manager read all activities employee own activities" ON public.crm_activities FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role) OR owner_employee_id = public.current_employee_id());
CREATE POLICY "employee insert own activities" ON public.crm_activities FOR INSERT TO authenticated WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee update own activities" ON public.crm_activities FOR UPDATE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id()) WITH CHECK (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());
CREATE POLICY "employee delete own activities" ON public.crm_activities FOR DELETE TO authenticated USING (NOT public.has_role(auth.uid(), 'manager'::app_role) AND owner_employee_id = public.current_employee_id());

DROP POLICY IF EXISTS "auth read crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "auth insert crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "owner or manager update crm_notes" ON public.crm_notes;
DROP POLICY IF EXISTS "owner or manager delete crm_notes" ON public.crm_notes;
CREATE POLICY "read notes by entity permission" ON public.crm_notes FOR SELECT TO authenticated USING (public.can_access_note(entity_type, entity_id));
CREATE POLICY "insert notes by entity permission" ON public.crm_notes FOR INSERT TO authenticated WITH CHECK (public.can_access_note(entity_type, entity_id) AND author_user_id = auth.uid());
CREATE POLICY "update own or manager notes" ON public.crm_notes FOR UPDATE TO authenticated USING ((author_user_id = auth.uid() OR public.has_role(auth.uid(), 'manager'::app_role)) AND public.can_access_note(entity_type, entity_id)) WITH CHECK ((author_user_id = auth.uid() OR public.has_role(auth.uid(), 'manager'::app_role)) AND public.can_access_note(entity_type, entity_id));
CREATE POLICY "delete own or manager notes" ON public.crm_notes FOR DELETE TO authenticated USING ((author_user_id = auth.uid() OR public.has_role(auth.uid(), 'manager'::app_role)) AND public.can_access_note(entity_type, entity_id));

DROP POLICY IF EXISTS "assignee or manager update task_stages" ON public.task_stages;
DROP POLICY IF EXISTS "assignee or manager write task_stages" ON public.task_stages;
CREATE POLICY "assignee or manager update task_stages" ON public.task_stages FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role) OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_stages.task_id AND t.assigned_to = public.current_employee_id())) WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role) OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_stages.task_id AND t.assigned_to = public.current_employee_id()));
CREATE POLICY "assignee or manager write task_stages" ON public.task_stages FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role) OR EXISTS (SELECT 1 FROM public.tasks t WHERE t.id = task_id AND t.assigned_to = public.current_employee_id()));