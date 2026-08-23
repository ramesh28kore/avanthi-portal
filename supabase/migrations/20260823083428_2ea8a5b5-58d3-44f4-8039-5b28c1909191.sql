CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = private, public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;

-- Update policies on profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on user_roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on cheat_sheets
DROP POLICY IF EXISTS "Published cheat sheets are readable" ON public.cheat_sheets;
DROP POLICY IF EXISTS "Admins can manage cheat sheets" ON public.cheat_sheets;
CREATE POLICY "Published cheat sheets are readable"
  ON public.cheat_sheets FOR SELECT TO authenticated
  USING (published = true OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage cheat sheets"
  ON public.cheat_sheets FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on practice_problems
DROP POLICY IF EXISTS "Published practice problems are readable" ON public.practice_problems;
DROP POLICY IF EXISTS "Admins can manage practice problems" ON public.practice_problems;
CREATE POLICY "Published practice problems are readable"
  ON public.practice_problems FOR SELECT TO authenticated
  USING (published = true OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage practice problems"
  ON public.practice_problems FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on practice_submissions
DROP POLICY IF EXISTS "Users can read own submissions" ON public.practice_submissions;
DROP POLICY IF EXISTS "Admins can manage submissions" ON public.practice_submissions;
CREATE POLICY "Users can read own submissions"
  ON public.practice_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage submissions"
  ON public.practice_submissions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on exams
DROP POLICY IF EXISTS "Published exams are readable" ON public.exams;
DROP POLICY IF EXISTS "Admins can manage exams" ON public.exams;
CREATE POLICY "Published exams are readable"
  ON public.exams FOR SELECT TO authenticated
  USING (published = true OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage exams"
  ON public.exams FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on exam_questions
DROP POLICY IF EXISTS "Exam questions readable for published exams" ON public.exam_questions;
DROP POLICY IF EXISTS "Admins can manage exam questions" ON public.exam_questions;
CREATE POLICY "Exam questions readable for published exams"
  ON public.exam_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
        AND (exams.published = true OR private.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );
CREATE POLICY "Admins can manage exam questions"
  ON public.exam_questions FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on exam_attempts
DROP POLICY IF EXISTS "Users can read own attempts" ON public.exam_attempts;
DROP POLICY IF EXISTS "Admins can manage attempts" ON public.exam_attempts;
CREATE POLICY "Users can read own attempts"
  ON public.exam_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins can manage attempts"
  ON public.exam_attempts FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

-- Update policies on exam_answers
DROP POLICY IF EXISTS "Users can read own answers" ON public.exam_answers;
DROP POLICY IF EXISTS "Admins can manage answers" ON public.exam_answers;
CREATE POLICY "Users can read own answers"
  ON public.exam_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
        AND (exam_attempts.user_id = auth.uid() OR private.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );
CREATE POLICY "Admins can manage answers"
  ON public.exam_answers FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);