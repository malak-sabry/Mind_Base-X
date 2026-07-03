CREATE TABLE public.crm_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  industry text DEFAULT '',
  website text DEFAULT '',
  country text DEFAULT '',
  city text DEFAULT '',
  size text DEFAULT 'small',
  annual_revenue numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  owner_employee_id uuid,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all access crm_accounts" ON public.crm_accounts FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_crm_accounts_updated BEFORE UPDATE ON public.crm_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name text NOT NULL,
  email text DEFAULT '',
  phone text DEFAULT '',
  job_title text DEFAULT '',
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  owner_employee_id uuid,
  status text NOT NULL DEFAULT 'lead',
  source text DEFAULT '',
  tags text[] DEFAULT '{}',
  notes text DEFAULT '',
  last_contacted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all access crm_contacts" ON public.crm_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'EGP',
  stage text NOT NULL DEFAULT 'new',
  probability integer NOT NULL DEFAULT 10,
  expected_close_date date,
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  owner_employee_id uuid,
  priority text NOT NULL DEFAULT 'medium',
  lost_reason text DEFAULT '',
  closed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all access crm_deals" ON public.crm_deals FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_crm_deals_updated BEFORE UPDATE ON public.crm_deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'call',
  title text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'pending',
  scheduled_at timestamptz,
  completed_at timestamptz,
  duration_minutes integer DEFAULT 0,
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  owner_employee_id uuid,
  outcome text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "all access crm_activities" ON public.crm_activities FOR ALL USING (true) WITH CHECK (true);
CREATE TRIGGER trg_crm_activities_updated BEFORE UPDATE ON public.crm_activities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_crm_contacts_account ON public.crm_contacts(account_id);
CREATE INDEX idx_crm_deals_stage ON public.crm_deals(stage);
CREATE INDEX idx_crm_deals_account ON public.crm_deals(account_id);
CREATE INDEX idx_crm_activities_deal ON public.crm_activities(deal_id);
CREATE INDEX idx_crm_activities_scheduled ON public.crm_activities(scheduled_at);