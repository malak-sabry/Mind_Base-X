CREATE TABLE IF NOT EXISTS public.task_deadline_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  employee_id uuid NOT NULL,
  deadline_date date NOT NULL,
  days_before integer NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (task_id, employee_id, deadline_date, days_before)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_deadline_reminders TO authenticated;
GRANT ALL ON public.task_deadline_reminders TO service_role;

ALTER TABLE public.task_deadline_reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "manager or assigned read task reminders" ON public.task_deadline_reminders;
DROP POLICY IF EXISTS "manager manage task reminders" ON public.task_deadline_reminders;

CREATE POLICY "manager or assigned read task reminders"
ON public.task_deadline_reminders
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR employee_id = public.current_employee_id()
);

CREATE POLICY "manager manage task reminders"
ON public.task_deadline_reminders
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'manager'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'manager'::app_role));

CREATE OR REPLACE FUNCTION public.can_manage_task(_task_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.tasks t
      LEFT JOIN public.employees e ON e.id = t.assigned_to
      WHERE t.id = _task_id
        AND (
          t.assigned_to = public.current_employee_id()
          OR e.user_id = auth.uid()
          OR lower(e.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
        )
    )
$$;

DROP POLICY IF EXISTS "assignee or manager update task_stages" ON public.task_stages;
DROP POLICY IF EXISTS "assignee or manager write task_stages" ON public.task_stages;

CREATE POLICY "assignee or manager update task_stages"
ON public.task_stages
FOR UPDATE
TO authenticated
USING (public.can_manage_task(task_id))
WITH CHECK (public.can_manage_task(task_id));

CREATE POLICY "assignee or manager write task_stages"
ON public.task_stages
FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_task(task_id));

CREATE OR REPLACE FUNCTION public.ensure_due_task_reminders()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
  reminder_title text;
  reminder_message text;
  actor_is_manager boolean;
  actor_employee uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  actor_is_manager := public.has_role(auth.uid(), 'manager'::app_role);
  actor_employee := public.current_employee_id();

  FOR r IN
    SELECT
      t.id AS task_id,
      t.title,
      t.assigned_to AS employee_id,
      t.deadline,
      (t.deadline::date - current_date) AS days_before
    FROM public.tasks t
    WHERE t.status <> 'done'
      AND (t.deadline::date - current_date) IN (1, 2, 3, 4)
      AND (actor_is_manager OR t.assigned_to = actor_employee)
  LOOP
    INSERT INTO public.task_deadline_reminders(task_id, employee_id, deadline_date, days_before)
    VALUES (r.task_id, r.employee_id, r.deadline::date, r.days_before)
    ON CONFLICT DO NOTHING;

    IF FOUND THEN
      reminder_title := 'تنبيه قرب موعد تسليم المهمة';
      reminder_message := 'المهمة "' || r.title || '" موعدها النهائي بعد ' || r.days_before || ' يوم — برجاء المتابعة والإنهاء قبل الموعد.';

      INSERT INTO public.notifications(target_role, target_employee_id, title, message, type)
      VALUES ('employee', r.employee_id, reminder_title, reminder_message, 'warning');

      INSERT INTO public.chat_messages(scope, task_id, sender_user_id, sender_employee_id, sender_name, sender_role, message)
      VALUES ('task', r.task_id, NULL, NULL, 'النظام', 'system', reminder_message);
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.ensure_due_task_reminders() TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_manager_note_to_owner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_employee uuid;
  target_title text;
  manager_note boolean;
BEGIN
  manager_note := NEW.author_role = 'manager' OR public.has_role(NEW.author_user_id, 'manager'::app_role);
  IF NOT manager_note THEN
    RETURN NEW;
  END IF;

  CASE NEW.entity_type
    WHEN 'account' THEN
      SELECT owner_employee_id, name INTO target_employee, target_title FROM public.crm_accounts WHERE id = NEW.entity_id;
    WHEN 'contact' THEN
      SELECT owner_employee_id, full_name INTO target_employee, target_title FROM public.crm_contacts WHERE id = NEW.entity_id;
    WHEN 'deal' THEN
      SELECT owner_employee_id, title INTO target_employee, target_title FROM public.crm_deals WHERE id = NEW.entity_id;
    WHEN 'activity' THEN
      SELECT owner_employee_id, title INTO target_employee, target_title FROM public.crm_activities WHERE id = NEW.entity_id;
    WHEN 'task' THEN
      SELECT assigned_to, title INTO target_employee, target_title FROM public.tasks WHERE id = NEW.entity_id;
    WHEN 'erp_machine' THEN
      SELECT responsible_employee_id, name INTO target_employee, target_title FROM public.erp_machines WHERE id = NEW.entity_id;
    ELSE
      target_employee := NULL;
  END CASE;

  IF target_employee IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.notifications(target_role, target_employee_id, title, message, type)
  VALUES (
    'employee',
    target_employee,
    'ملاحظة جديدة من المدير',
    'وضع المدير ملاحظة على ' || coalesce(target_title, 'عنصر') || ': ' || left(NEW.note, 160),
    'info'
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_manager_note_to_owner ON public.crm_notes;
CREATE TRIGGER trg_notify_manager_note_to_owner
AFTER INSERT ON public.crm_notes
FOR EACH ROW
EXECUTE FUNCTION public.notify_manager_note_to_owner();

CREATE OR REPLACE FUNCTION public.notify_employee_presence()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  changed_online boolean;
  title_text text;
  message_text text;
  event_at timestamp with time zone;
BEGIN
  changed_online := TG_OP = 'UPDATE' AND NEW.is_online IS DISTINCT FROM OLD.is_online;
  IF NOT changed_online THEN
    RETURN NEW;
  END IF;

  event_at := CASE WHEN NEW.is_online THEN coalesce(NEW.last_login_at, now()) ELSE coalesce(NEW.last_logout_at, now()) END;
  title_text := CASE WHEN NEW.is_online THEN 'موظف فتح حسابه' ELSE 'موظف أغلق حسابه' END;
  message_text := NEW.full_name || CASE WHEN NEW.is_online THEN ' فتح حسابه وهو متصل الآن — ' ELSE ' أغلق حسابه وخرج — ' END || to_char(event_at AT TIME ZONE 'Africa/Cairo', 'YYYY-MM-DD HH24:MI');

  INSERT INTO public.notifications(target_role, title, message, type)
  VALUES ('all', title_text, message_text, CASE WHEN NEW.is_online THEN 'success' ELSE 'info' END);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_employee_presence ON public.employees;
CREATE TRIGGER trg_notify_employee_presence
AFTER UPDATE OF is_online ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.notify_employee_presence();

ALTER TABLE public.task_deadline_reminders REPLICA IDENTITY FULL;
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.task_deadline_reminders;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;