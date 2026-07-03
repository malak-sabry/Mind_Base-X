DROP POLICY IF EXISTS "managers or self update employees" ON public.employees;

CREATE POLICY "managers or self update employees"
ON public.employees
FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
WITH CHECK (
  public.has_role(auth.uid(), 'manager'::app_role)
  OR user_id = auth.uid()
  OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

CREATE OR REPLACE FUNCTION public.link_employee_user_on_self_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NOT NULL
     AND NEW.user_id IS NULL
     AND lower(NEW.email) = lower(coalesce(auth.jwt() ->> 'email', '')) THEN
    NEW.user_id := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_employee_user_on_self_update ON public.employees;
CREATE TRIGGER trg_link_employee_user_on_self_update
BEFORE UPDATE ON public.employees
FOR EACH ROW
EXECUTE FUNCTION public.link_employee_user_on_self_update();