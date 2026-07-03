
CREATE TABLE public.crm_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  field_name text,
  old_value text,
  new_value text,
  changed_by_user_id uuid,
  changed_by_name text NOT NULL DEFAULT '',
  changed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_history_entity ON public.crm_history(entity_type, entity_id, changed_at DESC);

GRANT SELECT ON public.crm_history TO authenticated;
GRANT INSERT ON public.crm_history TO authenticated;
GRANT ALL ON public.crm_history TO service_role;

ALTER TABLE public.crm_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read crm_history" ON public.crm_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert crm_history" ON public.crm_history FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "managers delete crm_history" ON public.crm_history FOR DELETE TO authenticated USING (has_role(auth.uid(), 'manager'::app_role));

-- Generic trigger function to log changes
CREATE OR REPLACE FUNCTION public.log_crm_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  entity_type_name text := TG_ARGV[0];
  tracked_fields text[] := TG_ARGV[1]::text[];
  field text;
  old_val text;
  new_val text;
  actor_name text;
  actor_id uuid;
BEGIN
  actor_id := auth.uid();
  SELECT COALESCE(e.full_name, 'النظام') INTO actor_name FROM public.employees e WHERE e.user_id = actor_id LIMIT 1;
  IF actor_name IS NULL THEN actor_name := 'مستخدم'; END IF;

  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.crm_history(entity_type, entity_id, action, changed_by_user_id, changed_by_name)
    VALUES (entity_type_name, NEW.id, 'created', actor_id, actor_name);
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.crm_history(entity_type, entity_id, action, changed_by_user_id, changed_by_name)
    VALUES (entity_type_name, OLD.id, 'deleted', actor_id, actor_name);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    FOREACH field IN ARRAY tracked_fields LOOP
      EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', field, field) INTO old_val, new_val USING OLD, NEW;
      IF old_val IS DISTINCT FROM new_val THEN
        INSERT INTO public.crm_history(entity_type, entity_id, action, field_name, old_value, new_value, changed_by_user_id, changed_by_name)
        VALUES (entity_type_name, NEW.id, 'updated', field, old_val, new_val, actor_id, actor_name);
      END IF;
    END LOOP;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Triggers
CREATE TRIGGER trg_crm_accounts_history
AFTER INSERT OR UPDATE OR DELETE ON public.crm_accounts
FOR EACH ROW EXECUTE FUNCTION public.log_crm_changes('account', '{name,industry,status,size,city,country,website,annual_revenue,owner_employee_id,impact_percent,outcome_summary,onboarded_at,notes}');

CREATE TRIGGER trg_crm_deals_history
AFTER INSERT OR UPDATE OR DELETE ON public.crm_deals
FOR EACH ROW EXECUTE FUNCTION public.log_crm_changes('deal', '{title,stage,value,currency,probability,priority,expected_close_date,closed_at,account_id,contact_id,owner_employee_id,lost_reason,description}');

CREATE TRIGGER trg_crm_contacts_history
AFTER INSERT OR UPDATE OR DELETE ON public.crm_contacts
FOR EACH ROW EXECUTE FUNCTION public.log_crm_changes('contact', '{full_name,email,phone,job_title,status,source,account_id,owner_employee_id,last_contacted_at,notes}');

ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_history;
