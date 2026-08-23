CREATE TYPE public.app_role AS ENUM ('student', 'teacher', 'admin');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Admins can manage all profiles"
  ON public.profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.cheat_sheets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  ordering int NOT NULL DEFAULT 0,
  content jsonb NOT NULL DEFAULT '[]'::jsonb,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.cheat_sheets TO authenticated;
GRANT ALL ON public.cheat_sheets TO service_role;

ALTER TABLE public.cheat_sheets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published cheat sheets are readable"
  ON public.cheat_sheets FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage cheat sheets"
  ON public.cheat_sheets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.practice_problems (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  topic text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  difficulty text NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  starter_code text NOT NULL DEFAULT '',
  test_cases jsonb NOT NULL DEFAULT '[]'::jsonb,
  ordering int NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_problems TO authenticated;
GRANT ALL ON public.practice_problems TO service_role;

ALTER TABLE public.practice_problems ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published practice problems are readable"
  ON public.practice_problems FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage practice problems"
  ON public.practice_problems FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.practice_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  problem_id uuid REFERENCES public.practice_problems(id) ON DELETE CASCADE NOT NULL,
  code text NOT NULL,
  passed boolean NOT NULL DEFAULT false,
  output text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_submissions TO authenticated;
GRANT ALL ON public.practice_submissions TO service_role;

ALTER TABLE public.practice_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own submissions"
  ON public.practice_submissions FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can insert own submissions"
  ON public.practice_submissions FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can manage submissions"
  ON public.practice_submissions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  time_limit_minutes int NOT NULL DEFAULT 30,
  pass_score int NOT NULL DEFAULT 50,
  published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Published exams are readable"
  ON public.exams FOR SELECT TO authenticated
  USING (published = true OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can manage exams"
  ON public.exams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_option_index int NOT NULL,
  explanation text,
  ordering int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;
GRANT ALL ON public.exam_questions TO service_role;

ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Exam questions readable for published exams"
  ON public.exam_questions FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exams
      WHERE exams.id = exam_questions.exam_id
        AND (exams.published = true OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

CREATE POLICY "Admins can manage exam questions"
  ON public.exam_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  exam_id uuid REFERENCES public.exams(id) ON DELETE CASCADE NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  score int,
  UNIQUE (user_id, exam_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own attempts"
  ON public.exam_attempts FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Users can insert/update own attempts"
  ON public.exam_attempts FOR ALL TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can manage attempts"
  ON public.exam_attempts FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TABLE public.exam_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES public.exam_attempts(id) ON DELETE CASCADE NOT NULL,
  question_id uuid REFERENCES public.exam_questions(id) ON DELETE CASCADE NOT NULL,
  selected_option_index int,
  UNIQUE (attempt_id, question_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_answers TO authenticated;
GRANT ALL ON public.exam_answers TO service_role;

ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own answers"
  ON public.exam_answers FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
        AND (exam_attempts.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role))
    )
  );

CREATE POLICY "Users can insert own answers"
  ON public.exam_answers FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
        AND exam_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own answers"
  ON public.exam_answers FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts
      WHERE exam_attempts.id = exam_answers.attempt_id
        AND exam_attempts.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage answers"
  ON public.exam_answers FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

INSERT INTO public.cheat_sheets (topic, title, slug, ordering, content) VALUES
('Python Basics', 'Variables & Data Types', 'variables-data-types', 1, '[{"type":"text","content":"In Python, variables are created when you assign a value. No explicit type declaration is needed."},{"type":"code","content":"name = \"Alice\"\nage = 21\npi = 3.14\nis_active = True\n\nprint(type(name))  # str\nprint(type(age))   # int"},{"type":"note","content":"Common types: int, float, str, bool, list, tuple, dict, set."}]'::jsonb);

INSERT INTO public.cheat_sheets (topic, title, slug, ordering, content) VALUES
('Python Basics', 'Conditionals', 'conditionals', 2, '[{"type":"text","content":"Use if, elif, and else to control program flow."},{"type":"code","content":"score = 85\nif score >= 90:\n    grade = \"A\"\nelif score >= 80:\n    grade = \"B\"\nelse:\n    grade = \"C\"\nprint(grade)  # B"},{"type":"note","content":"Indentation matters in Python."}]'::jsonb);

INSERT INTO public.practice_problems (topic, title, description, difficulty, starter_code, test_cases) VALUES
('Python Basics', 'Sum Two Numbers', 'Write a function add(a, b) that returns the sum of two numbers.', 'easy', 'def add(a, b):\n    # your code here\n    pass', '[{"input":"add(2, 3)","expected":"5"},{"input":"add(10, 20)","expected":"30"},{"input":"add(-1, 1)","expected":"0"}]'::jsonb);

INSERT INTO public.practice_problems (topic, title, description, difficulty, starter_code, test_cases) VALUES
('Python Basics', 'Check Even Number', 'Write a function is_even(n) that returns True if n is even, otherwise False.', 'easy', 'def is_even(n):\n    # your code here\n    pass', '[{"input":"is_even(4)","expected":"True"},{"input":"is_even(7)","expected":"False"},{"input":"is_even(0)","expected":"True"}]'::jsonb);

INSERT INTO public.exams (title, description, time_limit_minutes, pass_score) VALUES
('Python Fundamentals', 'A quick review of variables, conditionals, and loops.', 15, 60);

INSERT INTO public.exam_questions (exam_id, question, options, correct_option_index, explanation, ordering)
SELECT
  (SELECT id FROM public.exams WHERE title = 'Python Fundamentals'),
  'Which of the following is a valid variable name in Python?',
  '["2name", "my-name", "my_name", "my name"]'::jsonb,
  2,
  'Variable names must start with a letter or underscore and cannot contain spaces or hyphens.',
  1
WHERE EXISTS (SELECT id FROM public.exams WHERE title = 'Python Fundamentals');

INSERT INTO public.exam_questions (exam_id, question, options, correct_option_index, explanation, ordering)
SELECT
  (SELECT id FROM public.exams WHERE title = 'Python Fundamentals'),
  'What is the output of print(2 + 3 * 4)?',
  '["20", "14", "24", "11"]'::jsonb,
  1,
  'Multiplication has higher precedence than addition, so 3*4 is evaluated first.',
  2
WHERE EXISTS (SELECT id FROM public.exams WHERE title = 'Python Fundamentals');

INSERT INTO public.exam_questions (exam_id, question, options, correct_option_index, explanation, ordering)
SELECT
  (SELECT id FROM public.exams WHERE title = 'Python Fundamentals'),
  'Which keyword is used to define a conditional block?',
  '["for", "if", "while", "def"]'::jsonb,
  1,
  'if introduces a conditional branch.',
  3
WHERE EXISTS (SELECT id FROM public.exams WHERE title = 'Python Fundamentals');