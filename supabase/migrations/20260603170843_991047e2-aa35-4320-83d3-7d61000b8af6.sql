
-- Chat messages: general or per-task
CREATE TABLE public.chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL DEFAULT 'general',          -- 'general' or 'task'
  task_id uuid,                                    -- null when scope='general'
  sender_user_id uuid,
  sender_employee_id uuid,
  sender_name text NOT NULL DEFAULT '',
  sender_role text NOT NULL DEFAULT 'employee',
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chat_messages TO authenticated;
GRANT ALL ON public.chat_messages TO service_role;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read chat" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert chat" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "owner or manager update chat" ON public.chat_messages FOR UPDATE TO authenticated
  USING (sender_user_id = auth.uid() OR has_role(auth.uid(), 'manager'));
CREATE POLICY "owner or manager delete chat" ON public.chat_messages FOR DELETE TO authenticated
  USING (sender_user_id = auth.uid() OR has_role(auth.uid(), 'manager'));
CREATE INDEX idx_chat_messages_scope_task ON public.chat_messages (scope, task_id, created_at);

-- CRM notes (manager remarks attached to any CRM entity)
CREATE TABLE public.crm_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,        -- 'deal' | 'account' | 'contact' | 'activity'
  entity_id uuid NOT NULL,
  author_user_id uuid,
  author_name text NOT NULL DEFAULT '',
  author_role text NOT NULL DEFAULT 'manager',
  note text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_notes TO authenticated;
GRANT ALL ON public.crm_notes TO service_role;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read crm_notes" ON public.crm_notes FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert crm_notes" ON public.crm_notes FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "owner or manager update crm_notes" ON public.crm_notes FOR UPDATE TO authenticated
  USING (author_user_id = auth.uid() OR has_role(auth.uid(), 'manager'));
CREATE POLICY "owner or manager delete crm_notes" ON public.crm_notes FOR DELETE TO authenticated
  USING (author_user_id = auth.uid() OR has_role(auth.uid(), 'manager'));
CREATE INDEX idx_crm_notes_entity ON public.crm_notes (entity_type, entity_id, created_at);

-- ERP machines moved to DB so manager + employees share data
CREATE TABLE public.erp_machines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  serial_number text DEFAULT '',
  purchase_date date NOT NULL DEFAULT CURRENT_DATE,
  cost numeric NOT NULL DEFAULT 0,
  expected_life_years int NOT NULL DEFAULT 10,
  warranty_months int NOT NULL DEFAULT 12,
  hourly_output numeric NOT NULL DEFAULT 0,
  spare_part_name text DEFAULT '',
  spare_part_cost numeric NOT NULL DEFAULT 0,
  spare_part_life_months int NOT NULL DEFAULT 6,
  status text NOT NULL DEFAULT 'operational',
  responsible_employee_id uuid,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.erp_machines TO authenticated;
GRANT ALL ON public.erp_machines TO service_role;
ALTER TABLE public.erp_machines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "auth read erp" ON public.erp_machines FOR SELECT TO authenticated USING (true);
CREATE POLICY "auth insert erp" ON public.erp_machines FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "auth update erp" ON public.erp_machines FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "manager delete erp" ON public.erp_machines FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'manager'));
CREATE TRIGGER erp_machines_updated BEFORE UPDATE ON public.erp_machines
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.crm_notes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.erp_machines;
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.employees;
ALTER PUBLICATION supabase_realtime ADD TABLE public.tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leave_requests;
