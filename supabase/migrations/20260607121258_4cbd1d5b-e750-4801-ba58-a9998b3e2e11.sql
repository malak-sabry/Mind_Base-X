
-- Task stages (live kanban)
CREATE TABLE IF NOT EXISTS public.task_stages (
  task_id uuid PRIMARY KEY,
  stage text NOT NULL DEFAULT 'not_started',
  updated_by uuid,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_stages TO authenticated;
GRANT ALL ON public.task_stages TO service_role;
ALTER TABLE public.task_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read task_stages" ON public.task_stages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "assignee or manager write task_stages" ON public.task_stages
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.tasks t JOIN public.employees e ON e.id = t.assigned_to
      WHERE t.id = task_stages.task_id AND e.user_id = auth.uid()
    )
  );

CREATE POLICY "assignee or manager update task_stages" ON public.task_stages
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.tasks t JOIN public.employees e ON e.id = t.assigned_to
      WHERE t.id = task_stages.task_id AND e.user_id = auth.uid()
    )
  ) WITH CHECK (true);

CREATE POLICY "manager delete task_stages" ON public.task_stages
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role));

ALTER PUBLICATION supabase_realtime ADD TABLE public.task_stages;
ALTER TABLE public.task_stages REPLICA IDENTITY FULL;

-- ERP spare parts
CREATE TABLE IF NOT EXISTS public.erp_spare_parts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL,
  name text NOT NULL,
  part_number text DEFAULT '',
  cost numeric NOT NULL DEFAULT 0,
  quantity integer NOT NULL DEFAULT 1,
  life_months integer NOT NULL DEFAULT 6,
  supplier text DEFAULT '',
  installed_at date,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_spare_parts TO authenticated;
GRANT ALL ON public.erp_spare_parts TO service_role;
ALTER TABLE public.erp_spare_parts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read spare_parts" ON public.erp_spare_parts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "responsible or manager insert spare_parts" ON public.erp_spare_parts
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.erp_machines m JOIN public.employees e ON e.id = m.responsible_employee_id
      WHERE m.id = erp_spare_parts.machine_id AND e.user_id = auth.uid()
    )
  );
CREATE POLICY "responsible or manager update spare_parts" ON public.erp_spare_parts
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.erp_machines m JOIN public.employees e ON e.id = m.responsible_employee_id
      WHERE m.id = erp_spare_parts.machine_id AND e.user_id = auth.uid()
    )
  ) WITH CHECK (true);
CREATE POLICY "manager delete spare_parts" ON public.erp_spare_parts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'manager'::app_role));

CREATE TRIGGER trg_spare_parts_updated BEFORE UPDATE ON public.erp_spare_parts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_spare_parts;
ALTER TABLE public.erp_spare_parts REPLICA IDENTITY FULL;

-- ERP production logs
CREATE TABLE IF NOT EXISTS public.erp_production_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  machine_id uuid NOT NULL,
  log_date date NOT NULL DEFAULT CURRENT_DATE,
  units_produced numeric NOT NULL DEFAULT 0,
  hours_operated numeric NOT NULL DEFAULT 0,
  downtime_hours numeric NOT NULL DEFAULT 0,
  notes text DEFAULT '',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_production_logs TO authenticated;
GRANT ALL ON public.erp_production_logs TO service_role;
ALTER TABLE public.erp_production_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "auth read prod_logs" ON public.erp_production_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "responsible or manager insert prod_logs" ON public.erp_production_logs
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.erp_machines m JOIN public.employees e ON e.id = m.responsible_employee_id
      WHERE m.id = erp_production_logs.machine_id AND e.user_id = auth.uid()
    )
  );
CREATE POLICY "responsible or manager update prod_logs" ON public.erp_production_logs
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.erp_machines m JOIN public.employees e ON e.id = m.responsible_employee_id
      WHERE m.id = erp_production_logs.machine_id AND e.user_id = auth.uid()
    )
  ) WITH CHECK (true);
CREATE POLICY "responsible or manager delete prod_logs" ON public.erp_production_logs
  FOR DELETE TO authenticated USING (
    public.has_role(auth.uid(), 'manager'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.erp_machines m JOIN public.employees e ON e.id = m.responsible_employee_id
      WHERE m.id = erp_production_logs.machine_id AND e.user_id = auth.uid()
    )
  );

CREATE TRIGGER trg_prod_logs_updated BEFORE UPDATE ON public.erp_production_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_production_logs;
ALTER TABLE public.erp_production_logs REPLICA IDENTITY FULL;

CREATE INDEX IF NOT EXISTS idx_spare_parts_machine ON public.erp_spare_parts(machine_id);
CREATE INDEX IF NOT EXISTS idx_prod_logs_machine_date ON public.erp_production_logs(machine_id, log_date DESC);

-- Also enable realtime on tasks if not already (used by Micromanage)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
ALTER TABLE public.tasks REPLICA IDENTITY FULL;
