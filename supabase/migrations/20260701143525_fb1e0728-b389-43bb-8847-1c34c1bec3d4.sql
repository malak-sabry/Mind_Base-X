CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT id
  FROM public.employees
  WHERE user_id = auth.uid()
     OR lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  ORDER BY CASE WHEN user_id = auth.uid() THEN 0 ELSE 1 END
  LIMIT 1
$$;