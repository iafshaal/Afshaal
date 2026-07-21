
-- Roles enum + user_roles + has_role
CREATE TYPE public.app_role AS ENUM ('super_admin', 'administrator', 'director', 'accountant', 'admission_officer');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  role app_role NOT NULL DEFAULT 'administrator',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- Trigger to create profile + role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _role app_role;
BEGIN
  _role := COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'administrator');
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), NEW.email, _role);
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, _role);
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Schools
CREATE TABLE public.schools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT NOT NULL UNIQUE,
  address TEXT,
  phone TEXT,
  email TEXT,
  principal_name TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  established_year INT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.schools TO authenticated;
GRANT ALL ON public.schools TO service_role;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth can manage schools" ON public.schools FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Students
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT,
  roll_no TEXT,
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  parent_name TEXT,
  parent_phone TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students TO authenticated;
GRANT ALL ON public.students TO service_role;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage students" ON public.students FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX ON public.students(school_id);

-- Staff
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  designation TEXT NOT NULL,
  department TEXT,
  email TEXT,
  phone TEXT,
  salary NUMERIC(10,2) NOT NULL DEFAULT 0,
  joined_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage staff" ON public.staff FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX ON public.staff(school_id);

-- Fees
CREATE TABLE public.fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  due_date DATE NOT NULL,
  paid_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.fees TO authenticated;
GRANT ALL ON public.fees TO service_role;
ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage fees" ON public.fees FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX ON public.fees(school_id);
CREATE INDEX ON public.fees(student_id);

-- Salary payments
CREATE TABLE public.salary_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  pay_month DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'paid',
  paid_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary_payments TO authenticated;
GRANT ALL ON public.salary_payments TO service_role;
ALTER TABLE public.salary_payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Auth manage salary" ON public.salary_payments FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE INDEX ON public.salary_payments(staff_id);

-- Seed 5 demo schools + students + staff so the dashboard has data on first load
INSERT INTO public.schools (name, code, address, phone, email, principal_name, established_year) VALUES
  ('Greenwood International Academy', 'GIA-01', '12 Meadow Rd, Lahore', '+92 300 1112233', 'gia@erp.school', 'Dr. Ayesha Khan', 2005),
  ('Riverside Public School', 'RPS-02', '88 River Ave, Karachi', '+92 300 4445566', 'rps@erp.school', 'Mr. Bilal Ahmed', 1998),
  ('Sunrise Grammar', 'SG-03', '5 Sunrise Blvd, Islamabad', '+92 300 7778899', 'sg@erp.school', 'Ms. Fatima Noor', 2011),
  ('Oakridge Model School', 'OMS-04', 'Sector G-9, Rawalpindi', '+92 300 2223344', 'oms@erp.school', 'Mr. Hassan Ali', 2001),
  ('Crescent Foundation School', 'CFS-05', 'Model Town, Multan', '+92 300 5556677', 'cfs@erp.school', 'Ms. Sana Rafiq', 2015);

-- Students seed (a few per school)
INSERT INTO public.students (school_id, first_name, last_name, class, section, roll_no, parent_name, parent_phone)
SELECT s.id, fn, ln, cl, sc, rn, pn, pp
FROM public.schools s
CROSS JOIN LATERAL (VALUES
  ('Ahmad','Raza','8','A','101','Raza Malik','+92 301 0000001'),
  ('Zara','Khan','7','B','102','Khan Sahib','+92 301 0000002'),
  ('Bilal','Iqbal','9','A','103','Iqbal Chaudhry','+92 301 0000003'),
  ('Hina','Farooq','6','C','104','Farooq Baig','+92 301 0000004')
) AS t(fn,ln,cl,sc,rn,pn,pp);

-- Staff seed
INSERT INTO public.staff (school_id, first_name, last_name, designation, department, email, phone, salary)
SELECT s.id, fn, ln, ds, dp, em, ph, sal
FROM public.schools s
CROSS JOIN LATERAL (VALUES
  ('Sadia','Malik','Principal','Administration','sadia@erp.school','+92 302 0001',180000),
  ('Rehan','Ali','Math Teacher','Academics','rehan@erp.school','+92 302 0002',85000),
  ('Nadia','Hussain','Accountant','Finance','nadia@erp.school','+92 302 0003',75000),
  ('Kamran','Yousaf','Admission Officer','Admissions','kamran@erp.school','+92 302 0004',65000)
) AS t(fn,ln,ds,dp,em,ph,sal);

-- Fees seed (one pending fee per student)
INSERT INTO public.fees (school_id, student_id, amount, description, status, due_date)
SELECT st.school_id, st.id, 15000, 'Term 1 Tuition', 'pending', CURRENT_DATE + INTERVAL '15 days'
FROM public.students st;
